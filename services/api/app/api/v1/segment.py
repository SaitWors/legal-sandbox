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
