from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

ROOT_DIR = Path(__file__).resolve().parents[2]
API_DIR = ROOT_DIR / "services" / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("LS_DB_PATH", f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("LS_STORAGE_BACKEND", "local")
    monkeypatch.setenv("LS_LOCAL_STORAGE_DIR", str(tmp_path / "uploads"))
    monkeypatch.setenv("LS_SECRET_KEY", "test-secret")
    monkeypatch.setenv("LS_CORS_ORIGINS", "http://localhost:3000")
    monkeypatch.setenv("LS_RESET_DB_ON_START", "1")

    SQLModel.metadata.clear()
    for module_name in list(sys.modules):
        if module_name == "app" or module_name.startswith("app."):
            del sys.modules[module_name]

    main = importlib.import_module("app.main")
    app = main.create_app()

    with TestClient(app) as test_client:
        yield test_client
