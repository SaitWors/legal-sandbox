from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)

def test_segment_two_paragraphs():
    body = {"text": "A\n\nB"}
    r = c.post("/api/v1/segment", json=body)
    assert r.status_code == 200
    data = r.json()
    assert "clauses" in data
    assert len(data["clauses"]) == 2
    assert data["clauses"][0]["index"] == 1
