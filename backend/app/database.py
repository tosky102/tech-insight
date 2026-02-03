"""Async database session and engine.

SQLAlchemy の非同期エンジン / セッションファクトリと、
FastAPI から利用する DB セッション依存性を定義するモジュール。
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.base import Base

# 非同期エンジンの設定
# - pool_pre_ping: 死んだ接続を自動で検出して再接続
# - pool_size / max_overflow: 同時接続数の上限をざっくり制御
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# 非同期セッションファクトリ
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 用の依存性: リクエストごとに DB セッションを提供する。

    ライフサイクル:
    - enter: 非同期セッションを生成
    - yield: エンドポイント側でクエリを実行
    - 正常終了: commit
    - 例外発生: rollback
    - 最後にセッションをクローズ
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """テーブルを作成するユーティリティ。

    Alembic でマイグレーションを管理しているため通常は使用しないが、
    テストや開発初期にサクッとテーブルを作る用途で利用できる。
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
