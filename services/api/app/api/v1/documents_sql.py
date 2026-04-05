<<<<<<< HEAD
# app/api/v1/documents_sql.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import DocumentCreate, DocumentOut
from app.models.db_models import DocumentDB
from app.db import get_session
from app.deps import get_current_user
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

router = APIRouter(tags=["documents"])

@router.post("/", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def create_document(payload: DocumentCreate, user = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    doc = DocumentDB(title=payload.title, text=payload.text, owner_id=user.id)
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc

@router.get("/", response_model=list[DocumentOut])
async def list_documents(user = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    res = await session.exec(select(DocumentDB).where(DocumentDB.owner_id == user.id).order_by(DocumentDB.id.desc()))
    return res.all()

@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: int, user = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    res = await session.get(DocumentDB, doc_id)
    if not res or res.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    return res
=======
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
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
