# infra/aws — Terraform: S3 Uploads Bucket + IAM

Provisions the S3 bucket for complaint photo uploads and the least-privilege
IAM user/policy the Next.js app uses to talk to it.

**Scope:** S3 + IAM only. No queues, Lambdas, or schedulers.  
**Region:** `ap-south-1`  
**Provider:** AWS `~> 6.0`  
**Terraform:** `>= 1.10` (native S3 state locking via `use_lockfile`)

---

## Resources Created

| Resource | Description |
|---|---|
| `aws_s3_bucket.uploads` | Complaint photo uploads bucket |
| `aws_s3_bucket_public_access_block` | All public access blocked |
| `aws_s3_bucket_ownership_controls` | `BucketOwnerEnforced` — ACLs disabled |
| `aws_s3_bucket_server_side_encryption_configuration` | SSE-S3 (AES256) |
| `aws_s3_bucket_cors_configuration` | `PUT` only, scoped to `prod_origin` + `dev_origin` |
| `aws_s3_bucket_lifecycle_configuration` | Expires `complaints/*` objects after N days |
| `aws_s3_bucket_policy` | Denies all non-HTTPS (`aws:SecureTransport = false`) |
| `aws_iam_policy.uploads_access` | `PutObject`, `GetObject`, `DeleteObject` on `<bucket>/*` |
| `aws_iam_user.app_runtime` | Static IAM user for the Next.js runtime |
| `aws_iam_user_policy_attachment` | Attaches the managed policy to the user |
| `aws_iam_access_key.app_runtime` | Long-lived access key for the IAM user |

---

## Prerequisites

### 1. Terraform installed (`>= 1.10`)

```bash
terraform -v
```

### 2. AWS CLI configured

```bash
aws configure   # or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars
```

### 3. Create the remote-state bucket (one-time, manual)

The backend bucket cannot be managed by the same Terraform config that stores
its state in it. Create it once before running `terraform init`:

```bash
# Replace bucket name below if you chose a different one — must match versions.tf exactly
STATE_BUCKET="jotacomplaint-tfstate"
REGION="ap-south-1"

aws s3api create-bucket \
  --bucket "$STATE_BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block \
  --bucket "$STATE_BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Confirm the bucket is ready before proceeding:

```bash
aws s3 ls "s3://$STATE_BUCKET"
aws s3api get-bucket-versioning --bucket "$STATE_BUCKET"
```

---

## Setup

### 1. Copy and fill in your variable values

```bash
cp terraform.tfvars.example terraform.tfvars
# then edit terraform.tfvars — it is gitignored, never commit it
```

| Variable | Required | Example | Notes |
|---|---|---|---|
| `bucket_name` | ✅ | `jotacomplaint-uploads-v2` | Must be globally unique |
| `prod_origin` | ✅ | `https://jotacomplaint.vercel.app` | Allowed CORS origin for presigned PUTs |
| `dev_origin` | ✅ | `http://localhost:3000` | Local dev CORS origin |
| `abandoned_upload_expiration_days` | ❌ | `7` | Default: 7 |

### 2. Initialise

```bash
terraform init
```

This downloads the AWS provider and configures the S3 backend. No prior
local state to migrate.

### 3. Format and validate

```bash
terraform fmt -recursive
terraform validate
```

### 4. Plan (review before applying)

```bash
terraform plan
```

Expected: **9 resources to add** — S3 bucket with 6 associated resources,
1 IAM policy, 1 IAM user, 1 policy attachment, 1 access key.

### 5. Apply (manual step — do not automate)

```bash
terraform apply
```

Review the plan output, then confirm. After apply, retrieve the access key:

```bash
terraform output -raw access_key_id       # write to Vercel env: AWS_ACCESS_KEY_ID
terraform output -raw secret_access_key   # write to Vercel env: AWS_SECRET_ACCESS_KEY
```

> **Security note:** The IAM secret access key is stored in plain text inside
> `terraform.tfstate`. The state bucket has SSE-S3 encryption and all public
> access blocked — do not grant `s3:GetObject` on the state bucket to any
> principal that should not see the key. After copying the secret to Vercel,
> avoid storing it anywhere else. Rotate via the AWS IAM console if compromised.

---

## Application Environment Variables

After `terraform apply`, set these on Vercel (or in `.env`):

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<from terraform output>
AWS_SECRET_ACCESS_KEY=<from terraform output>
AWS_S3_BUCKET_NAME=<value of bucket_name in terraform.tfvars>
```

---

## State Management

State is stored in `s3://jotacomplaint-tfstate/jotacomplaint/terraform.tfstate`.

- **Versioning** is enabled on the state bucket — rollback a corrupt state
  by restoring a previous object version via the AWS console.
- **Locking** uses Terraform 1.10+ native S3 conditional writes (`use_lockfile = true`).
  No DynamoDB table is needed.
- **Encryption** is SSE-S3 (AES256) on the state bucket.

---

## What This Config Does NOT Provision

- The state bucket itself (created manually — see Prerequisites §3)
- SQS queues, SNS topics, Lambda functions
- CloudFront distribution for the uploads bucket
- VPC, subnets, or any compute resources

---

## Future Improvements

### OIDC-based IAM for Vercel (recommended for production hardening)

The current setup uses a long-lived IAM user access key. The modern
AWS-recommended alternative is to use **OIDC federation**: Vercel acts as
an OIDC identity provider, and the app assumes an IAM role with no static
key at all. This eliminates key rotation risk entirely.

High-level steps when ready to migrate:

1. Create an IAM OIDC provider for `https://oidc.vercel.com`.
2. Create an IAM role with a trust policy scoped to your Vercel project's
   subject claim.
3. Grant the role the same `PutObject`/`GetObject`/`DeleteObject` permissions
   currently on `aws_iam_policy.uploads_access`.
4. Remove `aws_iam_user`, `aws_iam_access_key`, and `aws_iam_user_policy_attachment`
   from `main.tf`.
5. Use the AWS SDK's default credential chain in the Next.js app — no
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars needed.

Reference: [Vercel × AWS OIDC docs](https://vercel.com/docs/security/secure-backend-access/oidc/aws)

---

## Commit Convention

```
feat(infra): provision S3 uploads bucket and IAM via Terraform
```
