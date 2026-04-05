<<<<<<< HEAD
# services/api/app/api/v1/segment.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SegmentRequest(BaseModel):
    text: str

@router.post("/", status_code=200)
def segment_text(payload: SegmentRequest):
    # минимальная сегментация: по пустой строке
    parts = [p.strip() for p in payload.text.split("\n\n") if p.strip()]
    return {"parts": parts}
=======
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.analyzer import segment_clauses

router = APIRouter()


class SegmentRequest(BaseModel):
    text: str = Field(..., min_length=1)


@router.post("/", status_code=200)
def segment_text(payload: SegmentRequest):
    clauses = segment_clauses(payload.text)
    return {"clauses": clauses, "parts": [clause["text"] for clause in clauses]}
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
