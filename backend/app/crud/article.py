"""CRUD operations for Article.

Article テーブルに対する永続化ロジック（リポジトリ層）をまとめたモジュール。
FastAPI のエンドポイントから呼ばれ、DB アクセスを一箇所に集約する。
"""
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate


async def get_article(session: AsyncSession, article_id: int) -> Optional[Article]:
    """ID で単一記事を取得する。存在しない場合は None を返す。"""
    result = await session.execute(select(Article).where(Article.id == article_id))
    return result.scalar_one_or_none()


async def get_articles(
    session: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 20,
    keyword: Optional[str] = None,
    sort: str = "newest",
) -> tuple[list[Article], int]:
    """記事一覧 / キーワード検索

    - keyword が指定されている場合は title / content / category / author への LIKE 条件を付与
    - total には該当件数の総数（ページング前）を返す
    """
    q = select(Article)
    count_q = select(func.count()).select_from(Article)
    if keyword:
        k = f"%{keyword}%"
        q = q.where(
            (Article.title.ilike(k)) | (Article.content.ilike(k))
            | (Article.category.ilike(k)) | (Article.author.ilike(k))
        )
        count_q = count_q.where(
            (Article.title.ilike(k)) | (Article.content.ilike(k))
            | (Article.category.ilike(k)) | (Article.author.ilike(k))
        )
    total = (await session.execute(count_q)).scalar() or 0

    # ソート順
    # - newest: 更新日が新しい順
    # - oldest: 更新日が古い順
    if sort == "oldest":
        q = q.order_by(Article.updated_at.asc())
    else:
        q = q.order_by(Article.updated_at.desc())

    q = q.offset(skip).limit(limit)
    result = await session.execute(q)
    return list(result.scalars().all()), total


async def create_article(session: AsyncSession, data: ArticleCreate) -> Article:
    """Article レコードを新規作成する。embedding は別処理で計算する。"""
    article = Article(
        title=data.title,
        content=data.content,
        category=data.category,
        author=data.author,
    )
    session.add(article)
    await session.flush()
    await session.refresh(article)
    return article


async def update_article(
    session: AsyncSession,
    article: Article,
    data: ArticleUpdate,
) -> Article:
    """Article レコードを部分更新する。

    Pydantic の ArticleUpdate で送られてきたフィールドのみを上書きする。
    """
    if data.title is not None:
        article.title = data.title
    if data.content is not None:
        article.content = data.content
    if data.category is not None:
        article.category = data.category
    if data.author is not None:
        article.author = data.author
    await session.flush()
    await session.refresh(article)
    return article


async def delete_article(session: AsyncSession, article: Article) -> None:
    await session.delete(article)
    await session.flush()


async def semantic_search(
    session: AsyncSession,
    query_embedding: List[float],
    *,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Article], int]:
    """ベクトル類似度（コサイン距離）による記事検索

    - embedding 列が NULL でない記事のみを対象とする
    - cosine_distance(query_embedding) が小さい（= 類似度が高い）順に並べて返す
    - total には検索対象件数の総数（ページング前）を返す
    """
    count_q = select(func.count()).select_from(Article).where(Article.embedding.isnot(None))
    total = (await session.execute(count_q)).scalar() or 0
    q = (
        select(Article)
        .where(Article.embedding.isnot(None))
        .order_by(Article.embedding.cosine_distance(query_embedding))
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(q)
    return list(result.scalars().all()), total
