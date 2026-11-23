# ==============================================================================
# SmartStock Infrastructure as Code — Root Configuration
# Academic Course: B.Tech CSE DevOps & Automation Lab (ENSP461)
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  # In production, use remote S3 backend with DynamoDB state locking
  # backend "s3" {
  #   bucket         = "smartstock-terraform-state-2026"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "smartstock-tf-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SmartStock"
      Environment = var.environment
      Course      = "ENSP461-DevOps-Capstone"
      ManagedBy   = "Terraform"
    }
  }
}
