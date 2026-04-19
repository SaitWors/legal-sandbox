from __future__ import annotations

from contextlib import asynccontextmanager
import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.routes import router as v1
from app.config import CORS_ORIGINS, RESET_DB_ON_START
from app.db import init_db
from app.services.storage_service import StorageService

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("LIFESPAN: initializing DB...")
        await init_db(drop_first=RESET_DB_ON_START)
        StorageService().ensure_bucket()
        logger.info("LIFESPAN: startup complete")
    except Exception as exc:  # pragma: no cover
        logger.exception("LIFESPAN: startup failed: %s", exc)
    try:
        yield
    finally:
        logger.info("LIFESPAN: shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(title="Contract Workspace API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_product_headers(request: Request, call_next):
        request_id = uuid.uuid4().hex[:12]
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:  # pragma: no cover
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{(time.perf_counter() - started) * 1000:.1f}ms"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    app.include_router(v1, prefix="/api/v1")

    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
