# services/api/app/api/v1/auth.py
from fastapi import APIRouter, Depends, Response, Request, HTTPException
from app.models.schemas import UserRegister, UserLogin, UserOut, TokenResponse
from app.models.db_models import UserDB
from app.db import get_session
from app.security import ALGORITHM, SECRET_KEY, get_current_user_id, hash_password, verify_password, create_access_token, create_refresh_token
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserRegister, session: AsyncSession = Depends(get_session)):
    # Проверяем имя
    result = await session.exec(select(UserDB).where(UserDB.username == payload.username))
    if result.first():
        raise HTTPException(status_code=400, detail="username taken")

    user = UserDB(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password)
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, response: Response, session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(UserDB).where(UserDB.username == payload.username))
    user = result.first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token, expires_in = create_access_token(sub=str(user.id), extra={"role": user.role})
    refresh_token = create_refresh_token(sub=str(user.id))

    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7*24*3600,
        secure=False  # в проде включить True при https
    )

    return {"access_token": access_token, "expires_in": expires_in}

@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, session: AsyncSession = Depends(get_session)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    from jose import JWTError, jwt
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise JWTError("not refresh")
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await session.exec(select(UserDB).where(UserDB.id == user_id))
    user = result.first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token, expires_in = create_access_token(sub=str(user.id), extra={"role": user.role})
    return {"access_token": access_token, "expires_in": expires_in}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"ok": True}

@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: int = Depends(get_current_user_id), 
    session: AsyncSession = Depends(get_session)
):
    result = await session.exec(select(UserDB).where(UserDB.id == user_id))
    user = result.first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user