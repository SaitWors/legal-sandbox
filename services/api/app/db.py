# services/api/app/db.py
from typing import AsyncGenerator, Optional
import os
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.ext.asyncio import async_sessionmaker

# Конфиг: путь к базе (локально sqlite file). Можно переопределить через env.
DB_PATH = os.getenv("LS_DB_PATH", "sqlite+aiosqlite:///./data/legal_sandbox.db")
# Пример: sqlite+aiosqlite:///./data/legal_sandbox.db

# Создаём асинхронный engine
engine: AsyncEngine = create_async_engine(DB_PATH, echo=False, future=True)

# async session factory
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency для FastAPI — выдаёт асинхронную сессию.
    """
    async with async_session() as session:
        yield session

async def init_db(drop_first: bool = False) -> None:
    """
    Инициализация БД: создаём таблицы на основе SQLModel.metadata.
    Важно: импортировать модели до вызова create_all, чтобы metadata содержала таблицы.
    """
    # импорт моделей здесь, чтобы они зарегистрировались в metadata
    # избегаем циклических импортов, поэтому импорт внутри функции
    try:
        # Импорт всех моделей (измените путь, если у вас отличается структура)
        # Пример: from app.models import db_models
        import app.models.db_models  # noqa: F401
    except Exception:
        # если у тебя другая структура — подправь импорты выше
        pass

    async with engine.begin() as conn:
        if drop_first:
            # аккуратно: удаляет все таблицы
            await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

def get_engine() -> AsyncEngine:
    return engine
