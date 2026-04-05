<<<<<<< HEAD
# services/api/app/deps.py
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import async_session  # см. app/db.py: async_session = sessionmaker(...)
from app.models.db_models import UserDB  # твоя модель пользователя
from app.security import SECRET_KEY, ALGORITHM  # можно вынести в config или security
# если нет - можно импортировать из app.security

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Правильная аннотация AsyncGenerator предотвращает ошибку 'Return type ... must be compatible'
    """
=======
from __future__ import annotations

from typing import AsyncGenerator, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import async_session
from app.models.db_models import UserDB
from app.permissions import has_any_permission
from app.repositories.user_repository import UserRepository
from app.security import ALGORITHM, SECRET_KEY, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    async with async_session() as session:
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> UserDB:
<<<<<<< HEAD
    """
    Декодируем токен, получаем sub (user id) и вытаскиваем пользователя из БД.
    Бросаем 401 при ошибке.
    """
=======
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
<<<<<<< HEAD
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
=======
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except (JWTError, ValueError):
        raise credentials_exception

<<<<<<< HEAD
    q = await session.exec(select(UserDB).where(UserDB.id == user_id))
    user = q.first()
=======
    user = await UserRepository(session).get_by_id(user_id)
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
<<<<<<< HEAD
=======


def require_permissions(*permissions: str) -> Callable:
    async def dependency(current_user: UserDB = Depends(get_current_active_user)) -> UserDB:
        if not has_any_permission(current_user.role, permissions):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return dependency
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
