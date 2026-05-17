from __future__ import annotations

from app.services.external_terms_service import ExternalTermsService


class DummyResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return [{"word": "agreement", "score": 92000, "tags": ["syn", "n"]}]


class DummyClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, *args, **kwargs):
        return DummyResponse()


def test_upload_file_and_list(client):
    client.post("/api/v1/auth/register", json={"username": "admin", "email": "admin@example.com", "password": "secret123"})
    login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "secret123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/api/v1/documents/",
        json={"title": "Test document", "text": "Body", "category": "nda", "status": "draft"},
        headers=headers,
    )
    doc_id = created.json()["id"]

    uploaded = client.post(
        f"/api/v1/files/documents/{doc_id}",
        files={"file": ("hello.txt", b"demo content", "text/plain")},
        headers=headers,
    )
    assert uploaded.status_code == 201, uploaded.text

    listed = client.get(f"/api/v1/files/documents/{doc_id}", headers=headers)
    assert listed.status_code == 200, listed.text
    assert len(listed.json()["items"]) == 1


def test_external_terms_normalization():
    service = ExternalTermsService(client_factory=lambda: DummyClient())

    import asyncio

    result = asyncio.run(service.search("contract"))
    assert result.items[0].term == "agreement"
    assert result.items[0].relevance > 0
