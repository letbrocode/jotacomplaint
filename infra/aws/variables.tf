variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket storing complaint photo uploads"
  type        = string
}

variable "prod_origin" {
  description = "Production frontend origin allowed by the uploads bucket CORS policy"
  type        = string
}

variable "dev_origin" {
  description = "Local/dev frontend origin allowed by the uploads bucket CORS policy"
  type        = string
}

variable "abandoned_upload_expiration_days" {
  description = "Days before an object under complaints/ with no completed complaint record is expired"
  type        = number
  default     = 7
}