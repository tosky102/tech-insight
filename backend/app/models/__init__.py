"""SQLAlchemy models."""
from app.models.base import Base
from app.models.article import Article
from app.models.metrics import SearchLog, ArticleClickLog

__all__ = ["Base", "Article", "SearchLog", "ArticleClickLog"]
