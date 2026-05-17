from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import REFRESH_COOKIE_NAME, REFRESH_COOKIE_SECURE
from app.deps import get_current_active_user, get_session
from app.models.db_models import UserDB
from app.models.schemas import TokenResponse, UserLogin, UserOut, UserRegister
from app.repositories.auth_repository import AuthRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

router = APIRouter()


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        secure=REFRESH_COOKIE_SECURE,
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserRegister, session: AsyncSession = Depends(get_session)):
    service = AuthService(UserRepository(session), AuthRepository(session))
    return await service.register_user(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, response: Response, session: AsyncSession = Depends(get_session)):
    service = AuthService(UserRepository(session), AuthRepository(session))
    token_response, refresh_token = await service.login_user(payload)
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, session: AsyncSession = Depends(get_session)):
    service = AuthService(UserRepository(session), AuthRepository(session))
    token_response, refresh_token = await service.refresh_session(request.cookies.get(REFRESH_COOKIE_NAME, ""))
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post("/logout")
async def logout(request: Request, response: Response, session: AsyncSession = Depends(get_session)):
    service = AuthService(UserRepository(session), AuthRepository(session))
    await service.logout(request.cookies.get(REFRESH_COOKIE_NAME))
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: UserDB = Depends(get_current_active_user)):
    return current_user
