from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.analyzer import compute_findings, segment_clauses

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    dup_threshold: float = Field(default=0.85, ge=0.6, le=0.98)


@router.post("/")
def analyze_text(payload: AnalyzeRequest):
    clauses = segment_clauses(payload.text)
    findings = compute_findings(clauses, payload.dup_threshold)
    return {
        "clauses": clauses,
        "findings": findings,
        "dup_threshold": payload.dup_threshold,
        "summary": {
            "clauses": len(clauses),
            "findings": len(findings),
        },
    }
