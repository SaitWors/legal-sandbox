from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.db_models import RefreshTokenDB


class AuthRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_refresh_token(self, token: RefreshTokenDB) -> RefreshTokenDB:
        self.session.add(token)
        await self.session.commit()
        await self.session.refresh(token)
        return token

    async def get_refresh_token_by_jti(self, jti: str) -> RefreshTokenDB | None:
        result = await self.session.exec(select(RefreshTokenDB).where(RefreshTokenDB.jti == jti))
        return result.first()

    async def get_refresh_token_by_hash(self, token_hash: str) -> RefreshTokenDB | None:
        result = await self.session.exec(select(RefreshTokenDB).where(RefreshTokenDB.token_hash == token_hash))
        return result.first()

    async def revoke_refresh_token(self, token: RefreshTokenDB, *, replaced_by_jti: str | None = None) -> RefreshTokenDB:
        token.revoked_at = datetime.now(timezone.utc)
        token.replaced_by_jti = replaced_by_jti
        self.session.add(token)
        await self.session.commit()
        await self.session.refresh(token)
        return token
