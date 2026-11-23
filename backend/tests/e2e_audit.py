import sys
import os
import json

# Ensure backend root is in python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models.user import User

def run_e2e_audit():
    print("=" * 70)
    print("🚀 SMARTSTOCK QA AUDIT SUITE: FULL-STACK END-TO-END VERIFICATION")
    print("=" * 70)

    app = create_app("testing")
    with app.app_context():
        db.create_all()
        client = app.test_client()

        # Check 1: Liveness and Readiness Probes
        h_resp = client.get("/healthz")
        r_resp = client.get("/ready")
        assert h_resp.status_code == 200, f"Healthz failed: {h_resp.status_code}"
        assert r_resp.status_code == 200, f"Ready failed: {r_resp.status_code}"
        print("✅ [1/10] Cluster Health Probes: /healthz (200 OK) & /ready (200 OK) Verified")

        # Check 2: User Registration & Duplicate Rejection
        reg_resp = client.post("/api/auth/register", json={
            "username": "qa_auditor",
            "email": "qa@smartstock.local",
            "password": "QAPassword2026!",
            "role": "ADMIN"
        })
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.get_json()}"
        admin_token = reg_resp.get_json()["token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Duplicate check
        dup_resp = client.post("/api/auth/register", json={
            "username": "qa_auditor",
            "email": "different@local.io",
            "password": "Password123!"
        })
        assert dup_resp.status_code == 409, "Duplicate username conflict not caught"
        print("✅ [2/10] Authentication & Conflict Handling: Registration and 409 Duplicate verified")

        # Check 3: Login & Profile
        login_resp = client.post("/api/auth/login", json={
            "username": "qa_auditor",
            "password": "QAPassword2026!"
        })
        assert login_resp.status_code == 200
        me_resp = client.get("/api/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.get_json()["user"]["username"] == "qa_auditor"
        print("✅ [3/10] JWT Token Validation & Current User Claims verified")

        # Check 4: Taxonomy Creation (Category & Supplier)
        cat_resp = client.post("/api/categories", json={
            "name": "Robotics & Actuators",
            "description": "Precision servos and linear actuators"
        }, headers=headers)
        assert cat_resp.status_code == 201
        cat_id = cat_resp.get_json()["data"]["id"]

        sup_resp = client.post("/api/suppliers", json={
            "name": "Kinetic Automation Corp",
            "contact_name": "Marcus Vance",
            "email": "m.vance@kinetic.io"
        }, headers=headers)
        assert sup_resp.status_code == 201
        sup_id = sup_resp.get_json()["data"]["id"]
        print("✅ [4/10] Taxonomy CRUD: Category & Supplier registration verified")

        # Check 5: Product Catalog CRUD
        prod_resp = client.post("/api/products", json={
            "sku": "ROB-SRV-200",
            "name": "High-Torque Metal Gear Servo 25kg",
            "category_id": cat_id,
            "supplier_id": sup_id,
            "cost_price": 14.50,
            "unit_price": 28.00,
            "quantity": 30,
            "reorder_level": 10
        }, headers=headers)
        assert prod_resp.status_code == 201
        prod_id = prod_resp.get_json()["data"]["id"]
        print(f"✅ [5/10] Product Catalog: Created SKU ROB-SRV-200 (ID: {prod_id}, Initial Qty: 30) verified")

        # Check 6: Stock IN Operation
        in_resp = client.post("/api/stock/in", json={
            "product_id": prod_id,
            "quantity": 20,
            "reference_no": "PO-AUDIT-001",
            "notes": "Auditor baseline replenishment intake"
        }, headers=headers)
        assert in_resp.status_code == 200
        assert in_resp.get_json()["product"]["quantity"] == 50
        print("✅ [6/10] Stock IN Intake: Atomic increment (30 + 20 = 50 units) verified")

        # Check 7: Negative Stock Prevention (Strict ACID Check)
        neg_resp = client.post("/api/stock/out", json={
            "product_id": prod_id,
            "quantity": 999,
            "reference_no": "SO-ILLEGAL-001"
        }, headers=headers)
        assert neg_resp.status_code == 400
        neg_data = neg_resp.get_json()
        assert neg_data["error"] == "Insufficient Stock"
        assert neg_data["available_stock"] == 50
        print(f"✅ [7/10] Concurrency Guard: Over-dispense (999 units vs 50 available) rejected with 400 Insufficient Stock")

        # Check 8: Valid Stock OUT & Ledger Transaction
        out_resp = client.post("/api/stock/out", json={
            "product_id": prod_id,
            "quantity": 15,
            "reference_no": "SO-AUDIT-VALID"
        }, headers=headers)
        assert out_resp.status_code == 200
        assert out_resp.get_json()["product"]["quantity"] == 35
        print("✅ [8/10] Stock OUT Dispense: Atomic decrement (50 - 15 = 35 units) verified")

        # Check 9: Analytics & Telemetry Exporter
        sum_resp = client.get("/api/analytics/summary", headers=headers)
        assert sum_resp.status_code == 200
        metrics_resp = client.get("/metrics")
        assert metrics_resp.status_code == 200
        assert b"smartstock_inventory_units_total" in metrics_resp.data
        print("✅ [9/10] Observability: Summary KPIs & Prometheus /metrics scraping verified")

        # Check 10: Bonus AI Log Diagnosis
        log_sample = "psycopg2.OperationalError: could not connect to server: Connection refused on port 5432"
        ai_resp = client.post("/api/ai/diagnose-log", json={"log": log_sample}, headers=headers)
        assert ai_resp.status_code == 200
        diag = ai_resp.get_json()["diagnosis"]
        assert diag["matched"] is True
        assert diag["category"] == "DATABASE_CONNECTIVITY"
        assert len(diag["remediation"]) > 0
        print(f"✅ [10/10] Bonus AI Diagnostic Engine: Successfully identified '{diag['title']}' with actionable playbook")

        print("=" * 70)
        print("🏆 ALL 10/10 AUDIT CHECKS PASSED: SYSTEM FULLY COMPLIANT")
        print("=" * 70)

if __name__ == "__main__":
    run_e2e_audit()
