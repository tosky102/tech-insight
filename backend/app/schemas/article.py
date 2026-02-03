"""Pydantic schemas for Article API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ArticleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=2000)
    content: str = Field(..., min_length=1)
    category: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=500)


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=2000)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=500)


class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class ArticleListResponse(BaseModel):
    items: list[ArticleResponse]
    total: int
    page: int
    page_size: int
