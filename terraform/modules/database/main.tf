variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "database_subnets" { type = list(string) }
variable "app_security_group" { type = string }
variable "db_instance_class" { type = string }
variable "db_allocated_storage" { type = number }

resource "aws_db_subnet_group" "db_subnets" {
  name       = "smartstock-db-subnet-group-${var.environment}"
  subnet_ids = var.database_subnets
}

resource "aws_security_group" "db_sg" {
  name        = "smartstock-rds-sg-${var.environment}"
  description = "Controlled PostgreSQL access from backend app"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group]
    description     = "PostgreSQL connection from backend nodes"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "smartstock-db-${var.environment}"
  allocated_storage      = var.db_allocated_storage
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = var.db_instance_class
  db_name                = "smartstock_db"
  username               = "smartstock_admin"
  password               = "SmartStockSecureCloud2026!"
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = true
  deletion_protection    = false
}

output "db_endpoint" { value = aws_db_instance.postgres.address }
output "db_port" { value = aws_db_instance.postgres.port }
