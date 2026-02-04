"""Pydantic schemas for metrics API."""
from datetime import datetime

from pydantic import BaseModel, Field


class ClickLogCreate(BaseModel):
    """記事クリックの記録用リクエストボディ。"""

    article_id: int = Field(..., ge=1)
    mode: str = Field(..., description="keyword or semantic などの検索モード")
    query: str | None = Field(
        None,
        description="そのときの検索クエリ（任意。長すぎる場合はフロント側で truncate しても良い）",
    )


class SearchSummary(BaseModel):
    """検索サマリ（期間内）。"""

    total_searches: int
    zero_result_searches: int
    zero_result_rate: float
    keyword_searches: int
    semantic_searches: int


class PopularArticle(BaseModel):
    """人気記事（クリック数順）。"""

    article_id: int
    title: str
    click_count: int
    last_clicked_at: datetime


class PopularArticlesResponse(BaseModel):
    items: list[PopularArticle]

