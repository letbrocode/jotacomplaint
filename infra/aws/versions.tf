terraform {

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  required_version = ">=1.10" # 1.10+ needed for native S3 state locking

  backend "s3" {
    bucket       = "jotacomplaint-tfstate"
    key          = "jotacomplaint/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true # native S3 conditional-write locking — no DynamoDB table needed
  }
}

provider "aws" {
  region = var.aws_region
}