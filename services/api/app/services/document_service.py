from __future__ import annotations

from datetime import datetime
import math

from fastapi import HTTPException

from app.models.db_models import DocumentDB, UserDB
from app.models.schemas import DocumentCreate, DocumentListQuery, DocumentListResponse, DocumentOut, DocumentUpdate, PaginationMeta
from app.permissions import has_any_permission
from app.repositories.document_repository import DocumentRepository


class DocumentService:
    def __init__(self, document_repo: DocumentRepository):
        self.document_repo = document_repo

    def _ensure_scope(self, user: UserDB, document: DocumentDB, action: str) -> None:
        if document.owner_id == user.id:
            return
        if has_any_permission(user.role, {f"docs:{action}:any"}):
            return
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    async def list_documents(self, user: UserDB, query: DocumentListQuery) -> DocumentListResponse:
        effective_query = query.model_copy()
        if not has_any_permission(user.role, {"docs:read:any"}):
            effective_query.owner_id = int(user.id)
        elif effective_query.owner_id is None and user.role == "manager":
            # managers see all unless explicitly filtered
            pass
        items, total = await self.document_repo.list_documents(effective_query)
        pages = max(1, math.ceil(total / effective_query.page_size)) if total else 1
        return DocumentListResponse(
            items=[DocumentOut.model_validate(item) for item in items],
            meta=PaginationMeta(total=total, page=effective_query.page, page_size=effective_query.page_size, pages=pages),
        )

    async def get_document(self, user: UserDB, doc_id: int) -> DocumentDB:
        doc = await self.document_repo.get_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        self._ensure_scope(user, doc, "read")
        return doc

    async def create_document(self, user: UserDB, payload: DocumentCreate) -> DocumentDB:
        doc = DocumentDB(
            title=payload.title,
            text=payload.text,
            category=payload.category,
            status=payload.status,
            owner_id=int(user.id),
        )
        return await self.document_repo.create(doc)

    async def update_document(self, user: UserDB, doc_id: int, payload: DocumentUpdate) -> DocumentDB:
        doc = await self.get_document(user, doc_id)
        self._ensure_scope(user, doc, "update")
        updates = payload.model_dump(exclude_none=True)
        for field, value in updates.items():
            setattr(doc, field, value)
        doc.updated_at = datetime.utcnow()
        return await self.document_repo.save(doc)

    async def delete_document(self, user: UserDB, doc_id: int) -> None:
        doc = await self.get_document(user, doc_id)
        self._ensure_scope(user, doc, "delete")
        await self.document_repo.delete(doc)
