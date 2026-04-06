from __future__ import annotations

import os
import uuid

from fastapi import HTTPException, UploadFile

from app.models.db_models import FileAttachmentDB, UserDB
from app.models.schemas import AttachmentListResponse
from app.permissions import has_any_permission
from app.repositories.file_repository import FileRepository
from app.services.document_service import DocumentService
from app.services.storage_service import StorageService


class FileService:
    def __init__(self, file_repo: FileRepository, document_service: DocumentService, storage: StorageService):
        self.file_repo = file_repo
        self.document_service = document_service
        self.storage = storage

    async def list_files(self, user: UserDB, document_id: int) -> AttachmentListResponse:
        await self.document_service.get_document(user, document_id)
        items = await self.file_repo.list_by_document(document_id)
        return AttachmentListResponse(items=items)

    async def upload_file(self, user: UserDB, document_id: int, upload: UploadFile) -> FileAttachmentDB:
        document = await self.document_service.get_document(user, document_id)
        if document.owner_id != user.id and not has_any_permission(user.role, {"files:create:any", "docs:update:any"}):
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        content = await upload.read()
        self.storage.validate_upload(upload.content_type, len(content))
        extension = os.path.splitext(upload.filename or "file")[1]
        storage_key = f"documents/{document_id}/{uuid.uuid4().hex}{extension.lower()}"
        self.storage.save_bytes(storage_key, content, upload.content_type)
        attachment = FileAttachmentDB(
            document_id=document_id,
            owner_id=int(user.id),
            original_name=upload.filename or "file",
            storage_key=storage_key,
            content_type=upload.content_type or "application/octet-stream",
            size_bytes=len(content),
        )
        return await self.file_repo.create(attachment)

    async def get_file(self, user: UserDB, file_id: int) -> FileAttachmentDB:
        attachment = await self.file_repo.get_by_id(file_id)
        if not attachment:
            raise HTTPException(status_code=404, detail="File not found")
        document = await self.document_service.get_document(user, attachment.document_id)
        if document.owner_id != user.id and not has_any_permission(user.role, {"files:read:any", "docs:read:any"}):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return attachment

    async def delete_file(self, user: UserDB, file_id: int) -> None:
        attachment = await self.get_file(user, file_id)
        if attachment.owner_id != user.id and not has_any_permission(user.role, {"files:delete:any", "docs:delete:any"}):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        self.storage.delete(attachment.storage_key)
        await self.file_repo.delete(attachment)
