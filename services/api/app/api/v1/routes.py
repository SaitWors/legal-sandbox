# services/api/app/api/v1/routes.py
from fastapi import APIRouter
from .auth import router as auth_router
from .documents_sql import router as documents_router
from .segment import router as segment_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(documents_router, prefix="/documents", tags=["documents"])
router.include_router(segment_router, prefix="/segment", tags=["segment"])
