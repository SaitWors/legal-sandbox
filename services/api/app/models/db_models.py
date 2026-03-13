# services/api/app/models/db_models.py
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class DocumentDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    text: str
    owner_id: Optional[int] = Field(default=None, foreign_key="userdb.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, nullable=False)
    email: Optional[str] = None
    hashed_password: str
    is_active: bool = Field(default=True)
    role: str = Field(default="user")
    created_at: datetime = Field(default_factory=datetime.utcnow)
