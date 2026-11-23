def test_list_products_empty(client, admin_headers):
    resp = client.get("/api/products", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"] == []

def test_create_and_get_product(client, admin_headers):
    # First create category
    cat_resp = client.post("/api/categories", json={"name": "Motors"}, headers=admin_headers)
    assert cat_resp.status_code == 201
    cat_id = cat_resp.get_json()["data"]["id"]

    # Create product
    prod_resp = client.post("/api/products", json={
        "sku": "MOT-STEP-001",
        "name": "NEMA 23 Stepper Motor",
        "category_id": cat_id,
        "cost_price": 25.00,
        "unit_price": 45.00,
        "quantity": 20,
        "reorder_level": 5
    }, headers=admin_headers)
    assert prod_resp.status_code == 201
    prod_data = prod_resp.get_json()["data"]
    assert prod_data["sku"] == "MOT-STEP-001"
    assert prod_data["quantity"] == 20

    # Get product
    get_resp = client.get(f"/api/products/{prod_data['id']}", headers=admin_headers)
    assert get_resp.status_code == 200
    assert get_resp.get_json()["data"]["name"] == "NEMA 23 Stepper Motor"

def test_product_rbac_delete(client, sample_product, employee_headers, admin_headers):
    # Employee should be forbidden from deleting products
    del_resp = client.delete(f"/api/products/{sample_product}", headers=employee_headers)
    assert del_resp.status_code == 403

    # Admin should be permitted
    admin_del = client.delete(f"/api/products/{sample_product}", headers=admin_headers)
    assert admin_del.status_code == 200

def test_export_products_csv(client, sample_product, admin_headers):
    resp = client.get("/api/products/export/csv", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.mimetype == "text/csv"
    assert b"Digital Temperature Sensor" in resp.data
