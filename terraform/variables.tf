variable "aws_region" {
  type        = string
  description = "Target AWS Cloud region for deployment"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target operational deployment tier (dev, staging, prod)"
  default     = "production"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the SmartStock VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones for multi-AZ resiliency"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "cluster_name" {
  type        = string
  description = "Kubernetes EKS cluster identifier"
  default     = "smartstock-eks-cluster"
}

variable "node_instance_types" {
  type        = list(string)
  description = "EC2 instance types for Kubernetes worker node pool"
  default     = ["t3.medium"]
}

variable "db_instance_class" {
  type        = string
  description = "Instance sizing class for Managed RDS PostgreSQL"
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  type        = number
  description = "Storage capacity in GiB for PostgreSQL"
  default     = 20
}
