# services/api/tests/test_documents.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_crud_cycle():
    # create
    res = client.post("/api/v1/documents", json={"title":"Doc1","text":"Hello"})
    assert res.status_code == 201
    created = res.json()
    doc_id = created["id"]

    # get
    res = client.get(f"/api/v1/documents/{doc_id}")
    assert res.status_code == 200
    assert res.json()["title"] == "Doc1"

    # list
    res = client.get("/api/v1/documents")
    assert res.status_code == 200
    assert any(d["id"] == doc_id for d in res.json())

    # update
    res = client.put(f"/api/v1/documents/{doc_id}", json={"title": "Doc1 updated"})
    assert res.status_code == 200
    assert res.json()["title"] == "Doc1 updated"

    # delete
    res = client.delete(f"/api/v1/documents/{doc_id}")
    assert res.status_code == 204

    # not found after delete
    res = client.get(f"/api/v1/documents/{doc_id}")
    assert res.status_code == 404
