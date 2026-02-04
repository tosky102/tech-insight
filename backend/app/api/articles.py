"""Article CRUD and semantic search API.

記事に関する CRUD とセマンティック検索（AI 検索）のエンドポイント群。

役割:
- /articles: 一覧取得・キーワード検索・ページング
- /articles/search/semantic: ベクトル類似度を用いた意味検索
- /articles/{id}: 単一記事の取得・更新・削除
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.article import (
    create_article,
    delete_article,
    get_article,
    get_articles,
    semantic_search,
    update_article,
)
from app.database import get_db
from app.models.metrics import SearchLog
from app.schemas.article import (
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    ArticleUpdate,
)
from app.services.embedding import EmbeddingService

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    sort: str = Query(
        "newest",
        pattern="^(newest|oldest)$",
        description="並び順: newest=更新日が新しい順, oldest=古い順",
    ),
    db: AsyncSession = Depends(get_db),
) -> ArticleListResponse:
    """記事一覧の取得 + キーワード検索

    - page / page_size によるページング
    - keyword が指定されている場合は title / content / category / author で LIKE 検索
    - sort で更新日の新しい順 / 古い順を切り替え
    """
    skip = (page - 1) * page_size
    items, total = await get_articles(
        db,
        skip=skip,
        limit=page_size,
        keyword=keyword,
        sort=sort,
    )
    # 検索ログ（keyword モード）の記録
    log = SearchLog(
        query=keyword or "",
        mode="keyword",
        result_count=total,
    )
    db.add(log)
    return ArticleListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/search/semantic", response_model=ArticleListResponse)
async def search_semantic(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ArticleListResponse:
    """セマンティック検索: 自然言語クエリをベクトル化して類似記事を検索

    - クエリ文字列 q を埋め込みモデルでベクトル化
    - pgvector の cosine_distance を使って embedding 列と比較
    - 類似度（距離）の近い順に並べて返す
    """
    embedding = EmbeddingService.encode_single(q)
    skip = (page - 1) * page_size
    items, total = await semantic_search(db, embedding, skip=skip, limit=page_size)
    # 検索ログ（semantic モード）の記録
    log = SearchLog(
        query=q,
        mode="semantic",
        result_count=total,
    )
    db.add(log)
    return ArticleListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{article_id}", response_model=ArticleResponse)
async def read_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
) -> ArticleResponse:
    article = await get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.post("", response_model=ArticleResponse, status_code=201)
async def create_article_endpoint(
    data: ArticleCreate,
    db: AsyncSession = Depends(get_db),
) -> ArticleResponse:
    """記事の新規作成

    - まず通常の Article レコードを作成
    - タイトル + 本文を連結して埋め込みベクトルを計算し、embedding 列に保存
    """
    article = await create_article(db, data)
    text = f"{article.title}\n{article.content}"
    article.embedding = EmbeddingService.encode_single(text)
    await db.refresh(article)
    return article


@router.patch("/{article_id}", response_model=ArticleResponse)
async def update_article_endpoint(
    article_id: int,
    data: ArticleUpdate,
    db: AsyncSession = Depends(get_db),
) -> ArticleResponse:
    """記事の更新

    - 差分のみ Article に適用
    - 更新後のタイトル + 本文から再度埋め込みを計算し、embedding を上書きする
    """
    article = await get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article = await update_article(db, article, data)
    text = f"{article.title}\n{article.content}"
    article.embedding = EmbeddingService.encode_single(text)
    await db.refresh(article)
    return article


@router.delete("/{article_id}", status_code=204)
async def delete_article_endpoint(
    article_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    article = await get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await delete_article(db, article)
