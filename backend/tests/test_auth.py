def test_register_user_success(client):
    resp = client.post("/api/auth/register", json={
        "username": "newdevops",
        "email": "newdevops@smartstock.io",
        "password": "SecurePassword123!",
        "role": "EMPLOYEE"
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["username"] == "newdevops"
    assert data["user"]["role"] == "EMPLOYEE"

def test_register_duplicate_username(client, admin_user):
    resp = client.post("/api/auth/register", json={
        "username": "admin_test",
        "email": "different@smartstock.io",
        "password": "Password123!"
    })
    assert resp.status_code == 409
    assert "already taken" in resp.get_json()["message"]

def test_login_success(client, admin_user):
    resp = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "AdminPass123!"
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["role"] == "ADMIN"

def test_login_invalid_password(client, admin_user):
    resp = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "WrongPassword999!"
    })
    assert resp.status_code == 401
    assert "Invalid username or password" in resp.get_json()["message"]

def test_get_current_user_profile(client, admin_headers):
    resp = client.get("/api/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["user"]["username"] == "admin_test"
