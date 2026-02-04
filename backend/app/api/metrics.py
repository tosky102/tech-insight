"""Metrics API: search logs and popular articles."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.article import Article
from app.models.metrics import ArticleClickLog, SearchLog
from app.schemas.metrics import (
    ClickLogCreate,
    PopularArticlesResponse,
    PopularArticle,
    SearchSummary,
)


router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.post("/click", status_code=204)
async def log_click(
    body: ClickLogCreate,
    db: AsyncSession = Depends(get_db),
) -> None:
    """記事クリックを記録する。

    - frontend から記事カードクリック時に呼び出す想定
    """
    # 記事が存在するか軽くチェック（存在しない ID のログは捨てる）
    exists_q = await db.execute(
        select(func.count()).select_from(Article).where(Article.id == body.article_id)
    )
    if (exists_q.scalar() or 0) == 0:
        raise HTTPException(status_code=404, detail="Article not found")

    log = ArticleClickLog(
        article_id=body.article_id,
        mode=body.mode,
        query=body.query,
    )
    db.add(log)


@router.get("/search/summary", response_model=SearchSummary)
async def get_search_summary(
    days: int = Query(
        7,
        ge=1,
        le=90,
        description="集計対象とする過去の日数（デフォルト 7 日）",
    ),
    db: AsyncSession = Depends(get_db),
) -> SearchSummary:
    """検索クエリのサマリ統計を返す。"""
    since = datetime.now(tz=datetime.utcnow().astimezone().tzinfo) - timedelta(days=days)

    total_q = await db.execute(
        select(func.count()).select_from(SearchLog).where(SearchLog.created_at >= since)
    )
    total = total_q.scalar() or 0

    zero_q = await db.execute(
        select(func.count())
        .select_from(SearchLog)
        .where(SearchLog.created_at >= since, SearchLog.result_count == 0)
    )
    zero = zero_q.scalar() or 0

    by_mode_q = await db.execute(
        select(SearchLog.mode, func.count())
        .where(SearchLog.created_at >= since)
        .group_by(SearchLog.mode)
    )
    by_mode = {row[0]: int(row[1]) for row in by_mode_q.all()}

    keyword_cnt = by_mode.get("keyword", 0)
    semantic_cnt = by_mode.get("semantic", 0)

    zero_rate = float(zero) / float(total) if total > 0 else 0.0

    return SearchSummary(
        total_searches=int(total),
        zero_result_searches=int(zero),
        zero_result_rate=zero_rate,
        keyword_searches=int(keyword_cnt),
        semantic_searches=int(semantic_cnt),
    )


@router.get("/articles/popular", response_model=PopularArticlesResponse)
async def get_popular_articles(
    limit: int = Query(10, ge=1, le=100),
    days: Optional[int] = Query(
        None,
        ge=1,
        le=365,
        description="過去◯日分に絞る（指定なしなら全期間）",
    ),
    db: AsyncSession = Depends(get_db),
) -> PopularArticlesResponse:
    """クリック数の多い記事を返す。"""
    conds = []
    if days is not None:
        since = datetime.now(tz=datetime.utcnow().astimezone().tzinfo) - timedelta(
            days=days
        )
        conds.append(ArticleClickLog.created_at >= since)

    q = (
        select(
            Article.id,
            Article.title,
            func.count(ArticleClickLog.id).label("click_count"),
            func.max(ArticleClickLog.created_at).label("last_clicked_at"),
        )
        .join(Article, Article.id == ArticleClickLog.article_id)
        .where(*conds)  # type: ignore[arg-type]
        .group_by(Article.id, Article.title)
        .order_by(func.count(ArticleClickLog.id).desc())
        .limit(limit)
    )
    result = await db.execute(q)
    rows = result.all()
    items = [
        PopularArticle(
            article_id=row.id,
            title=row.title,
            click_count=int(row.click_count),
            last_clicked_at=row.last_clicked_at,
        )
        for row in rows
    ]
    return PopularArticlesResponse(items=items)

