from datetime import datetime, timezone
import enum
import uuid
from typing import List, Optional
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    ForeignKey,
    DateTime,
    Enum as SQLEnum,
    Table,
    Column,
)

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    poems = relationship("Poem", back_populates="author")

class Poem(Base):
    __tablename__ = "poems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    content = Column(Text, nullable=False)
    excerpt = Column(String, nullable=True)
    status = Column(String, default="published")
    mood = Column(String, nullable=True, index=True)
    tags = Column(String, nullable=True)
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author = relationship("User", back_populates="poems")
    
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class PoemStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class TagType(str, enum.Enum):
    FORM = "form"
    THEME = "theme"
    MOOD = "mood"


poem_tags = Table(
    "poem_tags",
    Base.metadata,
    Column("poem_id", ForeignKey("poems.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    type: Mapped[TagType] = mapped_column(SQLEnum(TagType), nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)

    poems: Mapped[List["Poem"]] = relationship("Poem", secondary=poem_tags, back_populates="tags")


class Poem(Base):
    __tablename__ = "poems"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[PoemStatus] = mapped_column(SQLEnum(PoemStatus), default=PoemStatus.DRAFT, nullable=False)
    
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=poem_tags, back_populates="poems")