<<<<<<< HEAD
# services/api/app/main.py
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import router as v1
from app.db import init_db  # убедись, что путь совпадает: app.db
=======
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
>>>>>>> 73dd6ff (С 1й по 3ю и docker)

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
<<<<<<< HEAD
    """
    Lifespan handler — выполняется при старте приложения (до обработки запросов)
    и после завершения (shutdown).
    Здесь удобно инициализировать БД, подключения к внешним сервисам и т.д.
    """
    try:
        logger.info("LIFESPAN: initializing DB...")
        await init_db()
        logger.info("LIFESPAN: DB initialized")
    except Exception as e:
        logger.exception("LIFESPAN: DB init failed: %s", e)
        # Не прерываем создание приложения; ошибку логируем.
        # При желании можно `raise` чтобы остановить запуск сервера.
    try:
        yield
    finally:
        # Здесь можно закрыть соединения/клиенты, если нужно
=======
    try:
        logger.info("LIFESPAN: initializing DB...")
        await init_db(drop_first=RESET_DB_ON_START)
        StorageService().ensure_bucket()
        logger.info("LIFESPAN: DB initialized")
    except Exception as exc:
        logger.exception("LIFESPAN: startup failed: %s", exc)
    try:
        yield
    finally:
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
        logger.info("LIFESPAN: shutdown complete")


def create_app() -> FastAPI:
<<<<<<< HEAD
    app = FastAPI(title="Legal Sandbox API", version="0.1.0", lifespan=lifespan)

    # CORS — фронт (dev)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
=======
    app = FastAPI(title="Legal Sandbox API", version="0.4.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

<<<<<<< HEAD
    # Роуты версии API
    app.include_router(v1, prefix="/api/v1")

    # Простая health-рутка (оставил тут, но можно вынести в routes)
=======
    @app.middleware("http")
    async def add_product_headers(request: Request, call_next):
        request_id = uuid.uuid4().hex[:12]
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{(time.perf_counter() - started) * 1000:.1f}ms"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    app.include_router(v1, prefix="/api/v1")

>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok"}

<<<<<<< HEAD
    # Глобальный handler ошибок (примитивный)
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

=======
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    return app


app = create_app()
