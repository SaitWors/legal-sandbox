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
