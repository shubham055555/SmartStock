def test_category_crud_and_rbac(client, admin_headers, employee_headers):
    # 1. Create category
    resp = client.post("/api/categories", json={
        "name": "Optics & Lasers",
        "description": "High precision collimators and laser diodes"
    }, headers=admin_headers)
    assert resp.status_code == 201
    cat_id = resp.get_json()["data"]["id"]

    # 2. Duplicate category rejection
    dup = client.post("/api/categories", json={
        "name": "Optics & Lasers"
    }, headers=admin_headers)
    assert dup.status_code == 409

    # 3. List categories
    lst = client.get("/api/categories?with_counts=true", headers=employee_headers)
    assert lst.status_code == 200
    assert any(c["name"] == "Optics & Lasers" for c in lst.get_json()["data"])

    # 4. Update category
    upd = client.put(f"/api/categories/{cat_id}", json={
        "name": "Optics & Laser Systems",
        "description": "Updated description"
    }, headers=employee_headers)
    assert upd.status_code == 200
    assert upd.get_json()["data"]["name"] == "Optics & Laser Systems"

    # 5. Delete category - Employee forbidden
    del_emp = client.delete(f"/api/categories/{cat_id}", headers=employee_headers)
    assert del_emp.status_code == 403

    # 6. Delete category - Admin allowed
    del_adm = client.delete(f"/api/categories/{cat_id}", headers=admin_headers)
    assert del_adm.status_code == 200

def test_supplier_crud_and_rbac(client, admin_headers, employee_headers):
    # 1. Create supplier
    resp = client.post("/api/suppliers", json={
        "name": "Photonics Global LLC",
        "contact_name": "Dr. Sarah Lin",
        "email": "slin@photonics.com",
        "phone": "+1-555-8821",
        "address": "Boulder, CO"
    }, headers=admin_headers)
    assert resp.status_code == 201
    sup_id = resp.get_json()["data"]["id"]

    # 2. List suppliers
    lst = client.get("/api/suppliers?with_counts=true", headers=employee_headers)
    assert lst.status_code == 200
    assert any(s["name"] == "Photonics Global LLC" for s in lst.get_json()["data"])

    # 3. Update supplier
    upd = client.put(f"/api/suppliers/{sup_id}", json={
        "name": "Photonics Global International",
        "phone": "+1-555-9999"
    }, headers=employee_headers)
    assert upd.status_code == 200
    assert upd.get_json()["data"]["name"] == "Photonics Global International"

    # 4. Delete supplier - Employee forbidden
    del_emp = client.delete(f"/api/suppliers/{sup_id}", headers=employee_headers)
    assert del_emp.status_code == 403

    # 5. Delete supplier - Admin allowed
    del_adm = client.delete(f"/api/suppliers/{sup_id}", headers=admin_headers)
    assert del_adm.status_code == 200
