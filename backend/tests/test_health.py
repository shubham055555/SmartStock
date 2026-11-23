def test_healthz_endpoint(client):
    resp = client.get("/healthz")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "smartstock-backend"

def test_ready_endpoint(client):
    resp = client.get("/ready")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"

def test_metrics_endpoint(client):
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert b"smartstock_http_requests_total" in resp.data

def test_ai_log_analyzer_deterministic(client, admin_headers):
    sample_error = "psycopg2.OperationalError: could not connect to server: Connection refused on port 5432"
    resp = client.post("/api/ai/diagnose-log", json={"log": sample_error}, headers=admin_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    diagnosis = data["diagnosis"]
    assert diagnosis["matched"] is True
    assert diagnosis["category"] == "DATABASE_CONNECTIVITY"
    assert "remediation" in diagnosis
    assert len(diagnosis["remediation"]) > 0
