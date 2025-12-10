# services/api/app/api/v1/documents_mem.py
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from datetime import datetime, timezone
from app.models.schemas import DocumentCreate, DocumentOut, DocumentUpdate

router = APIRouter(tags=["documents"])

_STORE: Dict[int, Dict] = {}
_NEXT_ID = 1

def _now():
    return datetime.now(timezone.utc)

@router.post("/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate):
    global _NEXT_ID
    doc_id = _NEXT_ID
    _NEXT_ID += 1
    item = {
        "id": doc_id,
        "title": payload.title,
        "text": payload.text,
        "created_at": _now(),
        "updated_at": _now(),
    }
    _STORE[doc_id] = item
    return item

@router.get("/documents", response_model=List[DocumentOut])
def list_documents():
    return list(_STORE.values())

@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: int):
    item = _STORE.get(doc_id)
    if not item:
        raise HTTPException(status_code=404, detail="Document not found")
    return item

@router.put("/documents/{doc_id}", response_model=DocumentOut)
def update_document(doc_id: int, payload: DocumentUpdate):
    item = _STORE.get(doc_id)
    if not item:
        raise HTTPException(status_code=404, detail="Document not found")
    if payload.title is not None:
        item["title"] = payload.title
    if payload.text is not None:
        item["text"] = payload.text
    item["updated_at"] = _now()
    _STORE[doc_id] = item
    return item

@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int):
    if doc_id not in _STORE:
        raise HTTPException(status_code=404, detail="Document not found")
    del _STORE[doc_id]
    return None
