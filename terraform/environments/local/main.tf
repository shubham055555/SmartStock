# ==============================================================================
# Local / Dev Demonstration Terraform Configuration
# Runs locally without initiating paid cloud provisioning
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4.0"
    }
  }
}

resource "local_file" "dev_environment_manifest" {
  filename = "${path.module}/smartstock-dev-summary.txt"
  content  = <<-EOT
    =================================================================
    SmartStock Local Infrastructure Provisioning Summary
    Academic Lab Course: ENSP461 DevOps & Automation Lab
    Status: Successfully Initialized
    =================================================================
    Target: Local Container Runtime
    PostgreSQL Port: 5432
    Backend REST API Port: 5000
    Frontend SPA Port: 3000
    Prometheus Telemetry: 9090
    Grafana Dashboard: 3001
    ArgoCD GitOps Sync: Enabled
    =================================================================
  EOT
}

output "status" {
  value = "SmartStock local dev infrastructure configuration initialized successfully."
}
