# SmartStock — Team Task Division & Contributions Breakdown
**Academic Course**: B.Tech CSE Semester VII DevOps & Automation Lab (ENSP461)  
**Evaluation**: 100 Marks | Total Team Members: 2 Students  

---

## Student 1: Backend Architecture, Database Concurrency & Cloud Infrastructure

**Assigned Lead**: Student 1  
**Primary Focus Areas**: RESTful Microservices, Relational Schema, Database Concurrency Control, Kubernetes Orchestration & Infrastructure as Code (Terraform/Ansible).

### Key Deliverables & Responsibilities:
1. **Flask Application Architecture**:
   - Engineered modular application factory (`backend/app/__init__.py`) and blueprint structure.
   - Configured structured JSON logging with dynamic `X-Request-ID` correlation middleware.
2. **Relational Database & Concurrency Control**:
   - Designed normalized PostgreSQL tables for `users`, `products`, `categories`, `suppliers`, `stock_transactions`, and `audit_logs`.
   - Engineered the `StockService` concurrency engine utilizing row-level locks (`with_for_update`) and PostgreSQL check constraints (`quantity >= 0`) to mathematically prevent negative inventory race conditions.
3. **Backend Authentication & Security**:
   - Implemented JWT token generation with custom role claims (`ADMIN` vs `EMPLOYEE`).
   - Created `@role_required` and `@admin_required` decorators enforcing backend authorization.
4. **Kubernetes Cluster Engineering**:
   - Authored all production Kubernetes manifests: `namespace`, `configmap`, `secret`, `postgres-statefulset`, `backend-deployment`, `frontend-deployment`, `ingress`, and `hpa`.
   - Built zero-downtime Blue-Green deployment architecture with automated traffic switching script.
5. **Infrastructure as Code (IaC)**:
   - Authored modular Terraform configurations for VPC networking, Managed RDS PostgreSQL, and EKS Cluster.
   - Developed Ansible automation playbooks for host provisioning, Docker engine setup, and K8s prerequisites.
6. **Backend Verification Suite**:
   - Wrote 17 comprehensive Pytest test cases validating authentication, product CRUD, RBAC, atomic stock transactions, and negative inventory prevention.

---

## Student 2: Frontend Engineering, CI/CD Automation & Observability Stack

**Assigned Lead**: Student 2  
**Primary Focus Areas**: React SPA User Interface, Tailwind CSS Design System, Jenkins CI/CD Automation, GitOps (ArgoCD), Observability (Prometheus/Grafana) & Bonus AI Log Diagnostics.

### Key Deliverables & Responsibilities:
1. **Modern SaaS Frontend Development**:
   - Initialized React 18, Vite, TypeScript, and Tailwind CSS architecture.
   - Developed polished Navy/Slate corporate SaaS theme with accessible contrast and responsive layouts.
   - Created reusable component library: `Modal`, `StatCard`, `Badge`, `ToastProvider`, and `DataTable`.
2. **Dashboard & Data Visualization**:
   - Built interactive analytics views with Recharts (stock flow bar charts, category asset pie charts).
   - Engineered real-time Critical Low Stock Alert Table with 1-click "+ Replenish" workflow.
   - Integrated quick demo login buttons for evaluators (`admin` / `staff`).
3. **Jenkins Continuous Integration / Continuous Deployment (CI/CD)**:
   - Authored declarative `Jenkinsfile` with multi-stage pipeline: Checkout, Flake8 linting, Pytest suite, Vitest suite, SonarQube quality gate, and multi-stage Docker image builds.
   - Configured GitHub Actions supplementary CI pipeline (`.github/workflows/ci.yml`).
4. **GitOps with ArgoCD**:
   - Created ArgoCD Application custom resource manifest and Kustomize overlays for declarative Git-driven cluster synchronization.
5. **Observability & Monitoring**:
   - Configured Prometheus metrics scrape configuration (`prometheus.yml`) and pre-built Grafana operational dashboard with live gauges for inventory valuation, latency, and throughput.
   - Designed ELK Stack pipeline (`logstash.conf`) for container log aggregation.
6. **Bonus AI Log Root Cause Analyzer**:
   - Engineered log sanitization and deterministic AI heuristic diagnosis engine (`ai_analyzer.py` and `AIDevOpsCenter.tsx`).
   - Integrated preset test traces and remediation command generator.
