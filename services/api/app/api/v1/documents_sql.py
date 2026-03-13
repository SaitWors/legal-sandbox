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
