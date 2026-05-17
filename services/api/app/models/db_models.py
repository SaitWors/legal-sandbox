from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, String, Text
from sqlmodel import Field, SQLModel


class UserDB(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, nullable=False, sa_column_kwargs={"unique": True})
    email: Optional[str] = Field(default=None, nullable=True, sa_column_kwargs={"unique": True})
    hashed_password: str
    is_active: bool = Field(default=True)
    role: str = Field(default="user", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentDB(SQLModel, table=True):
    __tablename__ = "documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, max_length=160)
    text: str = Field(sa_column=Column(Text, nullable=False))
    category: str = Field(default="general", index=True, max_length=80)
    status: str = Field(default="draft", index=True, max_length=32)
    owner_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RefreshTokenDB(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    jti: str = Field(index=True, sa_column_kwargs={"unique": True})
    token_hash: str = Field(sa_column=Column(String(128), nullable=False, unique=True))
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    revoked_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))
    replaced_by_jti: Optional[str] = Field(default=None, max_length=128)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FileAttachmentDB(SQLModel, table=True):
    __tablename__ = "file_attachments"

    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(foreign_key="documents.id", index=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    original_name: str = Field(max_length=255)
    storage_key: str = Field(sa_column=Column(String(255), nullable=False, unique=True))
    content_type: str = Field(max_length=120)
    size_bytes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
