from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

router = APIRouter(prefix="/api/v1", tags=["v1"])

@router.get("/health")
def health():
    return {"status": "ok"}

# ---- DTO (минимум для ЛР-2, полные — в models/dto.py, если захочешь)
class Clause(BaseModel):
    index: int = Field(ge=1)
    text: str
    header: Optional[str] = None

class SegmentRequest(BaseModel):
    text: str

class SegmentResponse(BaseModel):
    clauses: List[Clause]

@router.post("/segment", response_model=SegmentResponse)
def segment(req: SegmentRequest):
    # простая сегментация по пустым строкам
    parts = [p.strip() for p in req.text.split("\n\n") if p.strip()]
    clauses = [Clause(index=i + 1, text=p) for i, p in enumerate(parts)]
    if not clauses:  # фоллбек — весь текст как 1 пункт
        clauses = [Clause(index=1, text=req.text.strip())] if req.text.strip() else []
    return {"clauses": clauses}

Severity = Literal["low", "medium", "high"]

class DuplicateFinding(BaseModel):
    id: str
    type: Literal["duplicate"] = "duplicate"
    items: List[int]
    similarity: float
    severity: Severity
    reason: str
    resolved: bool = False

class ConflictFinding(BaseModel):
    id: str
    type: Literal["conflict"] = "conflict"
    a: int
    b: int
    signal: Literal["negation","numbers","modal","policy","other"]
    severity: Severity
    reason: str
    resolved: bool = False

Finding = DuplicateFinding | ConflictFinding

class AnalyzeRequest(BaseModel):
    clauses: List[Clause]
    dup_threshold: float = Field(0.85, ge=0.6, le=0.98)

class AnalyzeResponse(BaseModel):
    findings: List[Finding]

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    # ЛР-2: заглушка — логики нет, возвращаем пустой список по схеме
    return {"findings": []}
