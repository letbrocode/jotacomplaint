output "bucket_name" {
  value = aws_s3_bucket.uploads.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.uploads.arn
}

output "iam_user_name" {
  value = aws_iam_user.app_runtime.name
}

output "access_key_id" {
  value     = aws_iam_access_key.app_runtime.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.app_runtime.secret
  sensitive = true
}