def test_analytics_summary_and_charts(client, sample_product, admin_headers):
    # 1. Perform stock operations to populate transactions
    client.post("/api/stock/in", json={
        "product_id": sample_product,
        "quantity": 10,
        "unit_price": 5.00
    }, headers=admin_headers)

    client.post("/api/stock/out", json={
        "product_id": sample_product,
        "quantity": 5,
        "unit_price": 12.50
    }, headers=admin_headers)

    # 2. Query summary KPIs
    resp = client.get("/api/analytics/summary", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    summary = data["summary"]
    assert summary["total_products"] >= 1
    assert summary["total_stock_units"] >= 55  # 50 initial + 10 - 5 = 55
    assert summary["total_transactions"] >= 2
    assert summary["total_inventory_value"] > 0

    # 3. Query visual charts data
    chart_resp = client.get("/api/analytics/charts", headers=admin_headers)
    assert chart_resp.status_code == 200
    cdata = chart_resp.get_json()
    assert cdata["success"] is True
    assert "category_distribution" in cdata
    assert "top_value_products" in cdata
    assert "stock_movement" in cdata
    assert cdata["stock_movement"]["total_in"] >= 10
    assert cdata["stock_movement"]["total_out"] >= 5

def test_api_info_and_samples(client, admin_headers):
    info_resp = client.get("/api/info")
    assert info_resp.status_code == 200
    assert "SmartStock" in info_resp.get_json()["name"]

    samples_resp = client.get("/api/ai/samples", headers=admin_headers)
    assert samples_resp.status_code == 200
    assert len(samples_resp.get_json()["samples"]) >= 5
