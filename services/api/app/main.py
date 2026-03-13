# services/api/app/main.py
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import router as v1
from app.db import init_db  # убедись, что путь совпадает: app.db

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
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
        logger.info("LIFESPAN: shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(title="Legal Sandbox API", version="0.1.0", lifespan=lifespan)

    # CORS — фронт (dev)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Роуты версии API
    app.include_router(v1, prefix="/api/v1")

    # Простая health-рутка (оставил тут, но можно вынести в routes)
    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok"}

    # Глобальный handler ошибок (примитивный)
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return app


app = create_app()
