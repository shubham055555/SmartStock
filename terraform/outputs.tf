output "vpc_id" {
  description = "Provisioned VPC Identifier"
  value       = module.vpc.vpc_id
}

output "kubernetes_cluster_endpoint" {
  description = "Endpoint URL for Kubernetes control plane"
  value       = module.k8s_cluster.cluster_endpoint
}

output "kubernetes_cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.k8s_cluster.cluster_name
}

output "database_endpoint" {
  description = "Managed PostgreSQL connection endpoint address"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "database_port" {
  description = "Database listener port"
  value       = module.database.db_port
}
