from __future__ import annotations

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.db_models import UserDB


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: int) -> UserDB | None:
        return await self.session.get(UserDB, user_id)

    async def get_by_username(self, username: str) -> UserDB | None:
        result = await self.session.exec(select(UserDB).where(UserDB.username == username))
        return result.first()

    async def get_by_email(self, email: str) -> UserDB | None:
        result = await self.session.exec(select(UserDB).where(UserDB.email == email))
        return result.first()

    async def count_users(self) -> int:
        result = await self.session.exec(select(func.count()).select_from(UserDB))
        return int(result.one())

    async def create(self, user: UserDB) -> UserDB:
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def list_users(self) -> list[UserDB]:
        result = await self.session.exec(select(UserDB).order_by(UserDB.created_at.desc()))
        return list(result.all())

    async def update_role(self, user: UserDB, role: str) -> UserDB:
        user.role = role
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
