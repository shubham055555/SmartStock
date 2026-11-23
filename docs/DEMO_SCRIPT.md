# SmartStock — 10-Minute Academic Viva & Demonstration Script
**Course**: B.Tech CSE Semester VII DevOps & Automation Lab (ENSP461)  
**Evaluation Standard**: 100 Marks | Total Time: 10 Minutes  

---

## Demonstration Timeline Overview

| Time | Stage | Presenter | Key Focus Points |
|---|---|---|---|
| **00:00 – 01:30** | Project Overview & Architecture | Student 1 | Problem statement, cloud-native architecture, tech stack |
| **01:30 – 04:00** | Core Application & Concurrency Demo | Student 2 | Live UI walkthrough, Stock IN/OUT, negative inventory lock |
| **04:00 – 06:30** | DevOps Pipeline (Docker, CI/CD, K8s) | Student 1 | Multi-stage Docker, Jenkinsfile, Kubernetes manifests, Blue-Green |
| **06:30 – 08:30** | Observability, Metrics & Bonus AI | Student 2 | Prometheus /metrics, Grafana dashboard, AI Log Analyzer |
| **08:30 – 10:00** | IaC, Test Results & Q&A | Both | Pytest 17/17 pass, Terraform/Ansible, examiner questions |

---

## Detailed Minute-by-Minute Script

### Minute 00:00 – 01:30 | Introduction & Architecture (Student 1)
> **Narration**:  
> "Good morning, respected examiners. Today we present **SmartStock — Smart Inventory Management and DevOps Automation Platform**, developed for the Semester VII DevOps & Automation Lab capstone (ENSP461).  
> Standard inventory systems frequently suffer from database race conditions, inventory drift, and manual, error-prone deployment cycles. Our project solves this through a dual-pillar design: a robust full-stack application backed by PostgreSQL with atomic concurrency control, coupled with an end-to-end cloud-native DevOps lifecycle spanning Docker multi-stage builds, Jenkins CI/CD, Kubernetes orchestration with Blue-Green deployments, Terraform IaC, Prometheus observability, and an AI-based root cause log diagnostic engine."
>
> *(Show Architecture Diagram in `docs/ARCHITECTURE.md` on screen)*

---

### Minute 01:30 – 04:00 | Live Functional Demonstration (Student 2)
> **Action**: Navigate to `http://localhost:5173` (or port 3000 in Docker).
> 
> **Narration**:  
> "Notice the modern, responsive Navy/White SaaS user interface. For convenient academic evaluation, we have integrated 1-click credential buttons. Clicking 'Login as Admin' authenticates using JWT."
>
> 1. **Dashboard Overview**:
>    - Show Metric Cards: Total Products, Physical Stock Units, Inventory Valuation ($), Low Stock Alerts.
>    - Show Recharts Visualizations: Category Valuation Split and Top 5 Value Products.
>
> 2. **Product Catalog & RBAC**:
>    - Navigate to `/products`.
>    - Show search, category filters, and CSV Export.
>    - Click "Export CSV" to show immediate browser download of `smartstock_inventory_report.csv`.
>
> 3. **Concurrency Integrity & Negative Inventory Prevention**:
>    - Click "Stock Movement (+/-)" on product `SNS-BME280-I2C` (currently has 18 units).
>    - Switch to **Stock OUT**. Enter quantity `999`.
>    - Show immediate UI validation banner: *"Requested quantity exceeds available stock"*.
>    - Submit to backend. Show error dialog: `400 Insufficient Stock — Cannot dispense 999 units. Only 18 units available`.
>    - Show that database transaction rolled back cleanly with zero ledger corruption!
>    - Now perform a valid Stock IN of 20 units. Show balance update to 38 units and new entry in the Transaction Audit Ledger.

---

### Minute 04:00 – 06:30 | DevOps Engineering & Automation (Student 1)
> **Narration**:  
> "Now let us examine the DevOps architecture supporting SmartStock."
>
> 1. **Docker Multi-Stage Builds**:
>    - Open `docker/Dockerfile.backend`: Explain the 2-stage build reducing image size and the creation of unprivileged user `smartstock (uid 10001)`.
>    - Open `docker/Dockerfile.frontend`: Explain Node 20 builder transitioning to Nginx Alpine with custom security headers and reverse-proxy routing.
>    - Show root `docker-compose.yml` orchestrating PostgreSQL, Backend, Frontend, Prometheus, and Grafana on an isolated bridge network.
>
> 2. **Continuous Integration (Jenkins & GitHub Actions)**:
>    - Open `jenkins/Jenkinsfile`: Walk through the declarative stages: Checkout, Flake8 linting, Pytest with coverage XML, Frontend Vitest, SonarQube scan, Docker image build, and GitOps sync.
>    - Point out `.github/workflows/ci.yml` providing automated pull-request validation.
>
> 3. **Kubernetes & Zero-Downtime Blue-Green Deployment**:
>    - Open `kubernetes/`: Show 12 verified Kubernetes manifests (`StatefulSet` with PVC, `Deployments`, `Ingress`, `HPA`).
>    - Open `kubernetes/blue-green/`: Show `backend-blue.yaml` (v1.0.0), `backend-green.yaml` (v1.1.0), and `switch-traffic.sh`. Explain how service selector patching shifts traffic instantly with zero packet drop.

---

### Minute 06:30 – 08:30 | Observability & Bonus AI Log Analyzer (Student 2)
> **Action**: Navigate to `/devops` (AI DevOps Center) in the web UI.
>
> **Narration**:  
> "In Chapter 5 of our implementation, we built comprehensive observability and a bonus AI root cause diagnostic module."
>
> 1. **Live Health & Metrics**:
>    - Point out `/healthz` (Liveness: HTTP 200), `/ready` (Readiness: PostgreSQL socket connected), and `/metrics` (Prometheus exporter).
>    - Show that Prometheus metrics expose latency histograms and inventory gauges.
>
> 2. **AI Log Diagnostic Studio (Bonus)**:
>    - Select preset: *"PostgreSQL Connection Refused"*.
>    - Click **"Run AI Root Cause Diagnosis"**.
>    - Show result card: Identifies severity as **CRITICAL**, explains the socket connection failure, and outputs actionable bash remediation commands (`docker compose ps postgres`, `kubectl get pods -l app=postgres`).
>    - Select preset: *"Negative Inventory Stock Rejection"*. Run diagnosis to show root cause and inventory cycle count remediation.
>    - Explain that sensitive tokens and passwords in the logs are automatically redacted before analysis.

---

### Minute 08:30 – 10:00 | Test Results, IaC & Conclusion (Both Students)
> **Action**: Show terminal with passing Pytest and Vitest test reports.
>
> **Narration (Student 1)**:  
> "Our backend test suite achieves 17/17 passing tests with 79% statement coverage, verifying authentication, RBAC authorization, and atomic transaction rollback. Our frontend Vitest suite passes all component tests."
>
> **Narration (Student 2)**:  
> "Our Infrastructure as Code in `terraform/` is modularized into VPC, Database, and Kubernetes clusters, and our Ansible playbooks in `ansible/` provide idempotent provisioning."
>
> **Conclusion**:  
> "SmartStock is not merely a conceptual UI, but a fully functional, production-style, resilient inventory management and DevOps automation platform. We are now open for your questions. Thank you!"
