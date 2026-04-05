from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
LOCAL_STORAGE_DIR = Path(os.getenv("LS_LOCAL_STORAGE_DIR", DATA_DIR / "uploads")).resolve()
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

APP_ENV = os.getenv("APP_ENV", "development")
SECRET_KEY = os.getenv("LS_SECRET_KEY", "SUPER_SECRET_KEY_CHANGE_ME")
ALGORITHM = os.getenv("LS_JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("LS_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("LS_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
REFRESH_COOKIE_NAME = os.getenv("LS_REFRESH_COOKIE_NAME", "refresh_token")
REFRESH_COOKIE_SECURE = os.getenv("LS_REFRESH_COOKIE_SECURE", "0") == "1"
CORS_ORIGINS = [item.strip() for item in os.getenv("LS_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if item.strip()]

DB_PATH = os.getenv("LS_DB_PATH", "sqlite+aiosqlite:///./data/legal_sandbox.db")
RESET_DB_ON_START = os.getenv("LS_RESET_DB_ON_START", "0") == "1"

STORAGE_BACKEND = os.getenv("LS_STORAGE_BACKEND", "local")
S3_ENDPOINT_URL = os.getenv("LS_S3_ENDPOINT_URL")
S3_ACCESS_KEY = os.getenv("LS_S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("LS_S3_SECRET_KEY")
S3_BUCKET = os.getenv("LS_S3_BUCKET", "legal-sandbox")
S3_REGION = os.getenv("LS_S3_REGION", "us-east-1")
S3_PRESIGNED_EXPIRES = int(os.getenv("LS_S3_PRESIGNED_EXPIRES", "900"))

MAX_UPLOAD_SIZE = int(os.getenv("LS_MAX_UPLOAD_SIZE", str(5 * 1024 * 1024)))
ALLOWED_UPLOAD_TYPES = {
    item.strip() for item in os.getenv(
        "LS_ALLOWED_UPLOAD_TYPES",
        "text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ).split(",") if item.strip()
}
