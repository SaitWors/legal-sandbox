from __future__ import annotations

from fastapi import HTTPException

from app.permissions import AVAILABLE_ROLES
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def list_users(self):
        return await self.user_repo.list_users()

    async def update_role(self, user_id: int, role: str):
        if role not in AVAILABLE_ROLES or role == "guest":
            raise HTTPException(status_code=400, detail="Unsupported role")
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return await self.user_repo.update_role(user, role)
