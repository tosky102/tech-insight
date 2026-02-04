"""Models for search and click metrics."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SearchLog(Base):
    """検索クエリのログ。

    - query: 検索クエリ文字列
    - mode: 'keyword' / 'semantic' などの検索モード
    - result_count: ヒット件数
    """

    __tablename__ = "search_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str] = mapped_column(String(32), nullable=False)
    result_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class ArticleClickLog(Base):
    """記事クリックのログ。

    - article_id: クリックされた記事
    - mode: 検索モード（keyword / semantic）
    - query: そのときの検索クエリ（任意）
    """

    __tablename__ = "article_click_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
    )
    mode: Mapped[str] = mapped_column(String(32), nullable=False)
    query: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

