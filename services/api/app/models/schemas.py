# services/api/app/models/schemas.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    text: Optional[str] = Field(None, min_length=1)

class DocumentOut(BaseModel):
    id: int
    title: str
    text: str
    owner_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}  # pydantic v2 style / compatibility

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr]
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int