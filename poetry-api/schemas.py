from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from models import PoemStatus


# Tag Schemas
class TagBase(BaseModel):
    name: str
    type: str


class TagResponse(TagBase):
    id: UUID
    slug: str

    model_config = ConfigDict(from_attributes=True)


# Poem Schemas
class PoemCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    status: PoemStatus = PoemStatus.DRAFT


class PoemResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    status: PoemStatus
    views_count: int
    likes_count: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []

    model_config = ConfigDict(from_attributes=True)