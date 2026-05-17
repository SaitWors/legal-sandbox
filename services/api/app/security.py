from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, REFRESH_TOKEN_EXPIRE_DAYS, SECRET_KEY

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _prehash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(_prehash(password))


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(_prehash(password), hashed)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(sub: str, extra: Optional[dict] = None) -> tuple[str, int]:
    expire = _now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM), ACCESS_TOKEN_EXPIRE_MINUTES * 60


def create_refresh_token(sub: str, jti: str, extra: Optional[dict] = None) -> tuple[str, datetime]:
    expire = _now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": sub, "exp": expire, "type": "refresh", "jti": jti}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM), expire


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def generate_token_id() -> str:
    return secrets.token_urlsafe(24)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise JWTError("Token is not an access token")
        user_id = payload.get("sub")
        if user_id is None:
            raise JWTError("No sub in token")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
