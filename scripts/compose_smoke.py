from __future__ import annotations

import http.cookiejar
import json
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://localhost"
API = f"{BASE}/api/v1"


def wait(url: str, timeout: int = 90) -> None:
    deadline = time.time() + timeout
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                if response.status < 500:
                    return
        except Exception as exc:  # pragma: no cover
            last_error = exc
        time.sleep(2)
    raise RuntimeError(f"Service did not become ready: {url}. Last error: {last_error}")


class Client:
    def __init__(self):
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.access_token: str | None = None

    def request(self, method: str, path: str, *, data=None, headers=None, content_type="application/json"):
        url = path if path.startswith("http") else f"{API}{path}"
        payload = None
        req_headers = headers.copy() if headers else {}
        if self.access_token:
            req_headers["Authorization"] = f"Bearer {self.access_token}"
        if data is not None:
            if content_type == "application/json":
                payload = json.dumps(data).encode("utf-8")
                req_headers["Content-Type"] = "application/json"
            else:
                payload = data
                req_headers["Content-Type"] = content_type
        request = urllib.request.Request(url, data=payload, headers=req_headers, method=method)
        try:
            with self.opener.open(request, timeout=10) as response:
                body = response.read().decode("utf-8")
                return response.status, body
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            return exc.code, body


if __name__ == "__main__":
    wait(f"{BASE}/")
    wait(f"{API}/health")

    client = Client()
    status, body = client.request("GET", "/health")
    assert status == 200, body

    status, body = client.request("POST", "/auth/register", data={"username": "admin", "email": "admin@example.com", "password": "secret123"})
    assert status == 201, body

    status, body = client.request("POST", "/auth/login", data={"username": "admin", "password": "secret123"})
    assert status == 200, body
    client.access_token = json.loads(body)["access_token"]

    status, body = client.request("POST", "/documents/", data={"title": "Smoke Doc", "text": "1. Тестовый пункт.\n\n2. Второй тестовый пункт.", "category": "demo", "status": "draft"})
    assert status == 201, body
    doc_id = json.loads(body)["id"]

    status, body = client.request("GET", "/documents/?page=1&page_size=5")
    assert status == 200, body
    payload = json.loads(body)
    assert payload["meta"]["total"] >= 1, body

    status, body = client.request("POST", "/segment/", data={"text": "1. Первый пункт.\n\n2. Второй пункт."})
    assert status == 200, body

    status, body = client.request("POST", "/analyze/", data={"text": "1. Разрешено использовать результат.\n2. Запрещено использовать результат."})
    assert status == 200, body

    status, body = client.request("GET", f"/files/documents/{doc_id}")
    assert status == 200, body

    print("Compose smoke scenario passed")
