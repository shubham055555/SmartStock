# ==============================================================================
# SmartStock VPC Networking Module
# ==============================================================================

module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  environment        = var.environment
  cluster_name       = var.cluster_name
}

# ==============================================================================
# Managed PostgreSQL Database Module
# ==============================================================================

module "database" {
  source = "./modules/database"

  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  database_subnets     = module.vpc.database_subnet_ids
  app_security_group   = module.vpc.app_security_group_id
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
}

# ==============================================================================
# Kubernetes EKS Cluster Module
# ==============================================================================

module "k8s_cluster" {
  source = "./modules/k8s_cluster"

  cluster_name        = var.cluster_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  node_instance_types = var.node_instance_types
}
