import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import os
from fastapi.testclient import TestClient

TEST_DB_PATH = Path("/tmp/legal_sandbox_test.db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["TESTING"] = "1"

from app.main import app  # noqa: E402


def get_client():
    return TestClient(app)


def register_and_login(client: TestClient):
    register = client.post(
        "/api/v1/auth/register",
        json={"username": "demo_user", "email": "demo@example.com", "password": "supersecret"},
    )
    assert register.status_code == 201, register.text
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "demo_user", "password": "supersecret"},
    )
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_health():
    with get_client() as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_auth_and_documents_flow():
    with get_client() as client:
        headers = register_and_login(client)
        me = client.get("/api/v1/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["username"] == "demo_user"

        create = client.post(
            "/api/v1/documents/",
            headers=headers,
            json={"title": "Договор", "text": "1. Оплата 10 дней.\n2. Оплата 30 дней."},
        )
        assert create.status_code == 201, create.text
        doc_id = create.json()["id"]

        listing = client.get("/api/v1/documents/", headers=headers)
        assert listing.status_code == 200
        assert len(listing.json()) == 1

        update = client.put(f"/api/v1/documents/{doc_id}", headers=headers, json={"title": "Договор v2"})
        assert update.status_code == 200, update.text
        assert update.json()["title"] == "Договор v2"

        analysis = client.post(
            "/api/v1/analyze/",
            json={"text": "1. Исполнитель вправе работать.\n2. Исполнителю запрещено работать."},
        )
        assert analysis.status_code == 200, analysis.text
        assert analysis.json()["summary"]["clauses"] >= 2

        delete = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
        assert delete.status_code == 204, delete.text
