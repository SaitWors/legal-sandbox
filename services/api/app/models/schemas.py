# services/api/app/models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    text: str = Field(..., min_length=1)

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    text: Optional[str] = Field(None, min_length=1)

class DocumentOut(BaseModel):
    id: int
    title: str
    text: str
    created_at: datetime
    updated_at: datetime
