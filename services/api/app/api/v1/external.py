from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import ExternalTermsResponse
from app.services.external_terms_service import ExternalTermsService

router = APIRouter()


@router.get("/terms", response_model=ExternalTermsResponse)
async def search_related_terms(term: str = Query(..., min_length=2, max_length=80)):
    return await ExternalTermsService().search(term)
