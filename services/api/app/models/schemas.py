<<<<<<< HEAD
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
=======
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


DocumentStatus = Literal["draft", "review", "approved", "archived"]
DocumentSortBy = Literal["updated_at", "created_at", "title", "status", "category"]
SortOrder = Literal["asc", "desc"]


class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    text: str = Field(..., min_length=1)
    category: str = Field(default="general", min_length=1, max_length=80)
    status: DocumentStatus = "draft"


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=160)
    text: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1, max_length=80)
    status: Optional[DocumentStatus] = None

>>>>>>> 945d7f9 (lab-1-3-and_Docker)

class DocumentOut(BaseModel):
    id: int
    title: str
    text: str
<<<<<<< HEAD
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
=======
    category: str
    status: DocumentStatus
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int


class DocumentListResponse(BaseModel):
    items: list[DocumentOut]
    meta: PaginationMeta


class DocumentListQuery(BaseModel):
    q: Optional[str] = Field(default=None, max_length=120)
    category: Optional[str] = Field(default=None, max_length=80)
    status: Optional[DocumentStatus] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=6, ge=1, le=50)
    sort_by: DocumentSortBy = "updated_at"
    sort_order: SortOrder = "desc"
    owner_id: Optional[int] = None


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=40)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=40)
    password: str = Field(..., min_length=6, max_length=128)
>>>>>>> 945d7f9 (lab-1-3-and_Docker)


class UserOut(BaseModel):
    id: int
    username: str
<<<<<<< HEAD
    email: Optional[EmailStr]
=======
    email: Optional[EmailStr] = None
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}

<<<<<<< HEAD
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
=======

class UserRoleUpdate(BaseModel):
    role: Literal["user", "manager", "admin"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AttachmentOut(BaseModel):
    id: int
    document_id: int
    owner_id: int
    original_name: str
    content_type: str
    size_bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AttachmentListResponse(BaseModel):
    items: list[AttachmentOut]


class DownloadLinkResponse(BaseModel):
    url: str
    expires_in: int
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
