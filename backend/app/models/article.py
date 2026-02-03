"""Article model with vector embedding for semantic search.

技術記事を表現するドメインモデル。
タイトル / 本文などのテキスト情報に加え、セマンティック検索用のベクトル埋め込みを保持する。
"""
from datetime import datetime
from typing import Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Article(Base):
    """
    技術記事テーブル。

    - title: 記事タイトル（LIKE 検索用にインデックスを付与）
    - content: 本文
    - category: カテゴリ（一覧フィルタに使えるよう index=True）
    - author: 著者名
    - embedding: セマンティック検索用のベクトル（pgvector の VECTOR 型）
    """

    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(Text, nullable=True, index=True)
    author: Mapped[Optional[str]] = mapped_column(Text, nullable=True, index=True)
    # ベクトル検索用。all-MiniLM-L6-v2 の出力次元は 384
    embedding: Mapped[Optional[list]] = mapped_column(
        Vector(384),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        # セマンティック検索のための pgvector IVFFlat インデックス
        # - vector_cosine_ops: コサイン距離用の演算子クラス
        # - lists: 近似最近傍探索で使用するリスト数（データ量に応じてチューニング可能）
        Index(
            "ix_articles_embedding",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    def __repr__(self) -> str:
        return f"<Article(id={self.id}, title={self.title!r})>"
