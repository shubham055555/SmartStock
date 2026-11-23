def test_stock_in_success(client, sample_product, admin_headers):
    resp = client.post("/api/stock/in", json={
        "product_id": sample_product,
        "quantity": 30,
        "unit_price": 5.25,
        "reference_no": "PO-TEST-001",
        "notes": "Testing inventory replenishment."
    }, headers=admin_headers)

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    # Initial was 50 + 30 = 80
    assert data["product"]["quantity"] == 80
    assert data["transaction"]["transaction_type"] == "IN"
    assert data["transaction"]["quantity"] == 30
    assert data["transaction"]["balance_after"] == 80

def test_stock_out_success(client, sample_product, admin_headers):
    resp = client.post("/api/stock/out", json={
        "product_id": sample_product,
        "quantity": 20,
        "reference_no": "SO-TEST-001",
        "notes": "Testing order fulfillment."
    }, headers=admin_headers)

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    # Initial was 50 - 20 = 30
    assert data["product"]["quantity"] == 30
    assert data["transaction"]["transaction_type"] == "OUT"
    assert data["transaction"]["balance_after"] == 30

def test_stock_out_negative_inventory_prevention(client, sample_product, admin_headers):
    # Product starts with 50 units. Attempt to withdraw 999 units.
    resp = client.post("/api/stock/out", json={
        "product_id": sample_product,
        "quantity": 999,
        "reference_no": "SO-FAIL-001"
    }, headers=admin_headers)

    assert resp.status_code == 400
    data = resp.get_json()
    assert data["success"] is False
    assert data["error"] == "Insufficient Stock"
    assert data["available_stock"] == 50
    assert data["requested_quantity"] == 999

def test_stock_in_negative_or_zero_quantity_rejected(client, sample_product, admin_headers):
    resp = client.post("/api/stock/in", json={
        "product_id": sample_product,
        "quantity": -10
    }, headers=admin_headers)
    assert resp.status_code == 400
