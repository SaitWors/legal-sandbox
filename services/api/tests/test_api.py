def test_health(client) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_segment_returns_clauses(client) -> None:
    payload = {"text": "1. Первый пункт.\n\n2. Второй пункт."}
    response = client.post("/api/v1/segment/", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "clauses" in body
    assert len(body["clauses"]) >= 2


def test_analyze_returns_findings_shape(client) -> None:
    payload = {
        "text": "1. Исполнитель вправе привлекать субподрядчиков.\n2. Исполнитель не вправе привлекать третьих лиц без согласия.",
        "dup_threshold": 0.85,
    }
    response = client.post("/api/v1/analyze/", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "clauses" in body
    assert "findings" in body


def test_auth_and_documents_flow(client) -> None:
    register = client.post(
        "/api/v1/auth/register",
        json={"username": "admin_user", "email": "admin@example.com", "password": "secret123"},
    )
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"username": "admin_user", "password": "secret123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/api/v1/documents/",
        headers=headers,
        json={"title": "NDA", "text": "Текст договора", "category": "nda", "status": "draft"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["category"] == "nda"

    listing = client.get("/api/v1/documents/?category=nda&page=1", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["meta"]["total"] >= 1
