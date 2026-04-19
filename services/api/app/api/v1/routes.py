from fastapi import APIRouter

from .analyze import router as analyze_router
from .auth import router as auth_router
from .documents_sql import router as documents_router
from .external import router as external_router
from .files import router as files_router
from .segment import router as segment_router
from .users import router as users_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(documents_router, prefix="/documents", tags=["documents"])
router.include_router(files_router, prefix="/files", tags=["files"])
router.include_router(segment_router, prefix="/segment", tags=["segment"])
router.include_router(analyze_router, prefix="/analyze", tags=["analyze"])
router.include_router(external_router, prefix="/external", tags=["external"])
