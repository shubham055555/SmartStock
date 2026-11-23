# SmartStock System Architecture & DevOps Engineering Specification

## 1. High-Level Architectural Blueprint

SmartStock is architected as a cloud-native, distributed inventory management and reliability platform. It features strict transactional consistency, role-based security boundaries, automated CI/CD pipelines, container orchestration, GitOps synchronization, and automated root cause log intelligence.

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Edge Layer"]
        User["Warehouse Operator / Admin"]
        Browser["Modern React SPA (Vite + Tailwind + TypeScript)"]
        Ingress["Nginx Ingress Controller (Port 80/443)"]
        User -->|HTTPS| Browser
        Browser -->|REST API / Bearer JWT| Ingress
    end

    subgraph ServiceMesh["Container Orchestration (Kubernetes / Docker)"]
        FrontendPods["Frontend Pods (Nginx Static Serve + SPA Routing)"]
        BackendPods["Backend Service Pods (Flask + Gunicorn WSGI)"]
        HPA["Horizontal Pod Autoscaler (CPU/Mem Driven)"]
        
        Ingress -->|Static UI Assets| FrontendPods
        Ingress -->|/api/* Requests| BackendPods
        HPA -.->|Scales Replicas 2-10| BackendPods
    end

    subgraph ConcurrencyAndStorage["Data Persistence & Concurrency Engine"]
        PostgresStatefulSet["PostgreSQL 16 StatefulSet"]
        PVC["Persistent Volume Claim (10Gi Block Storage)"]
        LockingEngine["ACID Row-Lock & Check Constraint Engine"]
        
        BackendPods -->|SQLAlchemy ORM + Connection Pooling| PostgresStatefulSet
        PostgresStatefulSet --- PVC
        PostgresStatefulSet --- LockingEngine
    end

    subgraph ObservabilityStack["Observability & Intelligence Stack"]
        Prometheus["Prometheus Metric Collector (:9090)"]
        Grafana["Grafana Visual Dashboards (:3001)"]
        AIAnalyzer["Deterministic AI Log Analyzer Engine"]
        ELK["ELK Stack (Elasticsearch, Logstash, Kibana)"]

        BackendPods -->|/metrics Exporter| Prometheus
        BackendPods -->|JSON Audit Logs| ELK
        Prometheus --> Grafana
        BackendPods -->|Diagnostics Studio| AIAnalyzer
    end

    subgraph GitOpsCI["CI/CD & Infrastructure as Code"]
        GitHub["GitHub SCM Repository"]
        Jenkins["Jenkins Declarative Pipeline"]
        ArgoCD["ArgoCD GitOps Operator"]
        Terraform["Terraform IaC (AWS/Local)"]
        Ansible["Ansible Idempotent Playbooks"]

        GitHub -->|Webhook Trigger| Jenkins
        Jenkins -->|Multi-stage Build & Test| Jenkins
        Jenkins -->|Push Tagged Images| ArgoCD
        ArgoCD -->|Sync Git State| ServiceMesh
        Terraform -->|Provision Infra| ServiceMesh
        Ansible -->|Host Configuration| ServiceMesh
    end
```

---

## 2. Core Subsystem Breakdown

### 2.1 Concurrency Control & Negative Stock Prevention
In high-throughput inventory facilities, race conditions occur when multiple staff members simultaneously fulfill purchase orders for the same SKU. SmartStock resolves this at two distinct layers:
1. **Application Level**: `db.session.with_for_update()` explicitly locks targeted product rows during active Stock IN / Stock OUT transactions within an isolated transaction boundary.
2. **Database Level**: PostgreSQL relational table check constraints enforce `CONSTRAINT check_positive_stock CHECK (quantity >= 0)`. Any attempt to execute an over-dispense operation raises an immediate `InsufficientStockError` and rolls back all nested changes.

### 2.2 Blue-Green Deployment Strategy
Zero-downtime updates are coordinated via two active deployment tiers:
- `smartstock-backend-blue` (Active v1.0.0)
- `smartstock-backend-green` (Staged v1.1.0)
- `smartstock-backend-live` Service points its `selector: { version: blue }`.
- When tests pass on Green, `./switch-traffic.sh green` instantly patches the Service selector with zero dropped TCP connections.

### 2.3 Prometheus & Grafana Monitoring Architecture
The backend registers custom instrumentation counters and gauges:
- `smartstock_http_requests_total{method, endpoint, status}`
- `smartstock_http_request_duration_seconds{method, endpoint}`
- `smartstock_inventory_items_total`
- `smartstock_inventory_units_total`
- `smartstock_inventory_value_usd`
Prometheus scrapes `/metrics` at 5-second intervals, visualized on Grafana dashboard panels.
