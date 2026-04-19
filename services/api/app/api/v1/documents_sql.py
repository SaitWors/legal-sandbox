from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.deps import get_current_active_user, get_session, require_permissions
from app.models.db_models import UserDB
from app.models.schemas import DocumentCreate, DocumentListQuery, DocumentListResponse, DocumentOut, DocumentUpdate
from app.repositories.document_repository import DocumentRepository
from app.services.document_service import DocumentService

router = APIRouter(tags=["documents"])


def _service(session: AsyncSession) -> DocumentService:
    return DocumentService(DocumentRepository(session))


@router.post("/", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def create_document(
    payload: DocumentCreate,
    user: UserDB = Depends(require_permissions("docs:create")),
    session: AsyncSession = Depends(get_session),
):
    return await _service(session).create_document(user, payload)


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    q: str | None = Query(default=None, max_length=120),
    category: str | None = Query(default=None, max_length=80),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=50),
    sort_by: str = Query(default="updated_at"),
    sort_order: str = Query(default="desc"),
    owner_id: int | None = Query(default=None),
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    query = DocumentListQuery(
        q=q,
        category=category,
        status=status_filter,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        owner_id=owner_id,
    )
    return await _service(session).list_documents(user, query)


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(
    doc_id: int,
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    return await _service(session).get_document(user, doc_id)


@router.put("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: int,
    payload: DocumentUpdate,
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    return await _service(session).update_document(user, doc_id, payload)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int,
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    await _service(session).delete_document(user, doc_id)
    return None
