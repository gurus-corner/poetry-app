from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from models import PoemStatus
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

# --- POEM SCHEMAS ---
class PoemBase(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    status: Optional[str] = "published"
    mood: Optional[str] = None
    tags: Optional[str] = None

class PoemCreate(PoemBase):
    pass

class PoemResponse(PoemBase):
    id: int
    slug: str
    views_count: int
    created_at: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True

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