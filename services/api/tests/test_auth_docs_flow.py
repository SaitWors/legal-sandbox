def test_auth_and_documents_flow(client):
    register = client.post("/api/v1/auth/register", json={"username": "admin", "email": "admin@example.com", "password": "secret123"})
    assert register.status_code == 201, register.text
    assert register.json()["role"] == "admin"

    login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "secret123"})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/api/v1/documents/",
        json={"title": "Test document", "text": "Body", "category": "nda", "status": "draft"},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    payload = created.json()
    assert payload["category"] == "nda"

    listed = client.get("/api/v1/documents/?page=1&page_size=10", headers=headers)
    assert listed.status_code == 200, listed.text
    assert listed.json()["meta"]["total"] == 1

    updated = client.put(
        f"/api/v1/documents/{payload['id']}",
        json={"status": "review", "category": "procurement"},
        headers=headers,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "review"
