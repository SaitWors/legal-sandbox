from __future__ import annotations

from typing import AsyncGenerator, Callable

from fastapi import Depends, HTTPException, status
from jose import JWTError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import async_session
from app.models.db_models import UserDB
from app.permissions import has_any_permission
from app.repositories.user_repository import UserRepository
from app.security import decode_token, oauth2_scheme


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except (JWTError, ValueError):
        raise credentials_exception

    user = await UserRepository(session).get_by_id(user_id)
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_permissions(*permissions: str) -> Callable:
    async def dependency(current_user: UserDB = Depends(get_current_active_user)) -> UserDB:
        if not has_any_permission(current_user.role, permissions):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return dependency
