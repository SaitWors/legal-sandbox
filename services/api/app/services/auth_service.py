from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from jose import JWTError

from app.models.db_models import RefreshTokenDB, UserDB
from app.models.schemas import TokenResponse, UserLogin, UserRegister
from app.permissions import AVAILABLE_ROLES
from app.repositories.auth_repository import AuthRepository
from app.repositories.user_repository import UserRepository
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_token_id,
    hash_password,
    hash_token,
    verify_password,
)


class AuthService:
    def __init__(self, user_repo: UserRepository, auth_repo: AuthRepository):
        self.user_repo = user_repo
        self.auth_repo = auth_repo

    async def register_user(self, payload: UserRegister) -> UserDB:
        if await self.user_repo.get_by_username(payload.username):
            raise HTTPException(status_code=400, detail="username taken")
        if payload.email and await self.user_repo.get_by_email(payload.email):
            raise HTTPException(status_code=400, detail="email taken")

        role = "admin" if await self.user_repo.count_users() == 0 else "user"
        user = UserDB(
            username=payload.username,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=role,
        )
        return await self.user_repo.create(user)

    async def login_user(self, payload: UserLogin) -> tuple[TokenResponse, str]:
        user = await self.user_repo.get_by_username(payload.username)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return await self._issue_session(user)

    async def refresh_session(self, raw_refresh_token: str) -> tuple[TokenResponse, str]:
        if not raw_refresh_token:
            raise HTTPException(status_code=401, detail="No refresh token")
        try:
            payload = decode_token(raw_refresh_token)
            if payload.get("type") != "refresh":
                raise JWTError("not refresh")
            user_id = int(payload.get("sub"))
            jti = str(payload.get("jti"))
        except (JWTError, TypeError, ValueError):
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        token_record = await self.auth_repo.get_refresh_token_by_jti(jti)
        if not token_record or token_record.token_hash != hash_token(raw_refresh_token):
            raise HTTPException(status_code=401, detail="Refresh token not recognized")
        if token_record.revoked_at is not None:
            raise HTTPException(status_code=401, detail="Refresh token revoked")
        if token_record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh token expired")

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")

        session = await self._issue_session(user)
        _, new_refresh_token = session
        new_payload = decode_token(new_refresh_token)
        await self.auth_repo.revoke_refresh_token(token_record, replaced_by_jti=str(new_payload.get("jti")))
        return session

    async def logout(self, raw_refresh_token: str | None) -> None:
        if not raw_refresh_token:
            return
        token_hash = hash_token(raw_refresh_token)
        token_record = await self.auth_repo.get_refresh_token_by_hash(token_hash)
        if token_record and token_record.revoked_at is None:
            await self.auth_repo.revoke_refresh_token(token_record)

    async def _issue_session(self, user: UserDB) -> tuple[TokenResponse, str]:
        access_token, expires_in = create_access_token(sub=str(user.id), extra={"role": user.role})
        jti = generate_token_id()
        refresh_token, expires_at = create_refresh_token(sub=str(user.id), jti=jti, extra={"role": user.role})
        await self.auth_repo.create_refresh_token(
            RefreshTokenDB(
                user_id=int(user.id),
                jti=jti,
                token_hash=hash_token(refresh_token),
                expires_at=expires_at,
            )
        )
        return TokenResponse(access_token=access_token, expires_in=expires_in), refresh_token
