from __future__ import annotations

import mimetypes
import os
from pathlib import Path

from itsdangerous import URLSafeTimedSerializer

from app.config import (
    LOCAL_STORAGE_DIR,
    MAX_UPLOAD_SIZE,
    S3_ACCESS_KEY,
    S3_BUCKET,
    S3_ENDPOINT_URL,
    S3_PRESIGNED_EXPIRES,
    S3_REGION,
    S3_SECRET_KEY,
    SECRET_KEY,
    STORAGE_BACKEND,
)

try:
    import boto3
except Exception:  # pragma: no cover - optional local dependency in some environments
    boto3 = None


class StorageService:
    def __init__(self):
        self.serializer = URLSafeTimedSerializer(SECRET_KEY, salt="file-download")
        self.backend = STORAGE_BACKEND
        self.presigned_expires = S3_PRESIGNED_EXPIRES
        self.bucket = S3_BUCKET
        if self.backend == "s3" and boto3 is not None:
            self.client = boto3.client(
                "s3",
                endpoint_url=S3_ENDPOINT_URL,
                aws_access_key_id=S3_ACCESS_KEY,
                aws_secret_access_key=S3_SECRET_KEY,
                region_name=S3_REGION,
            )
        else:
            self.client = None

    def ensure_bucket(self) -> None:
        if self.backend != "s3" or self.client is None:
            return
        existing = {item["Name"] for item in self.client.list_buckets().get("Buckets", [])}
        if self.bucket not in existing:
            self.client.create_bucket(Bucket=self.bucket)

    def validate_upload(self, content_type: str | None, size: int) -> None:
        from fastapi import HTTPException
        from app.config import ALLOWED_UPLOAD_TYPES

        if size > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_UPLOAD_SIZE} bytes")
        if content_type and content_type not in ALLOWED_UPLOAD_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type")

    def save_bytes(self, storage_key: str, content: bytes, content_type: str | None = None) -> None:
        if self.backend == "s3" and self.client is not None:
            self.ensure_bucket()
            extra = {"ContentType": content_type} if content_type else {}
            self.client.put_object(Bucket=self.bucket, Key=storage_key, Body=content, **extra)
            return
        target = LOCAL_STORAGE_DIR / storage_key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    def delete(self, storage_key: str) -> None:
        if self.backend == "s3" and self.client is not None:
            self.client.delete_object(Bucket=self.bucket, Key=storage_key)
            return
        target = LOCAL_STORAGE_DIR / storage_key
        if target.exists():
            target.unlink()

    def build_download_url(self, file_id: int, storage_key: str) -> tuple[str, int]:
        if self.backend == "s3" and self.client is not None:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": storage_key},
                ExpiresIn=self.presigned_expires,
            )
            return url, self.presigned_expires
        token = self.serializer.dumps({"file_id": file_id, "storage_key": storage_key})
        return f"/api/v1/files/{file_id}/download?token={token}", self.presigned_expires

    def validate_download_token(self, token: str, file_id: int, storage_key: str) -> None:
        from fastapi import HTTPException

        try:
            payload = self.serializer.loads(token, max_age=self.presigned_expires)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired file link")
        if payload.get("file_id") != file_id or payload.get("storage_key") != storage_key:
            raise HTTPException(status_code=401, detail="Invalid or expired file link")

    def get_local_file(self, storage_key: str) -> tuple[Path, str]:
        target = LOCAL_STORAGE_DIR / storage_key
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        return target, content_type
