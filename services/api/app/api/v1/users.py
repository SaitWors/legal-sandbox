from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.deps import get_session, require_permissions
from app.models.db_models import UserDB
from app.models.schemas import UserOut, UserRoleUpdate
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService

router = APIRouter(tags=["users"])


@router.get("/", response_model=list[UserOut])
async def list_users(
    current_user: UserDB = Depends(require_permissions("users:read:any")),
    session: AsyncSession = Depends(get_session),
):
    del current_user
    return await UserService(UserRepository(session)).list_users()


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    current_user: UserDB = Depends(require_permissions("roles:manage")),
    session: AsyncSession = Depends(get_session),
):
    del current_user
    return await UserService(UserRepository(session)).update_role(user_id, payload.role)
