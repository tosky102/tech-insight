"""Alembic environment. Uses sync driver for migrations."""
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

from app.config import settings
from app.models.base import Base
from app.models.article import Article  # noqa: F401 - register model

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Sync URL for Alembic (psycopg2)
sync_url = settings.database_url.replace("postgresql+asyncpg", "postgresql")
if sync_url == settings.database_url:
    sync_url = settings.database_url.replace("postgresql://", "postgresql+psycopg2://")
else:
    sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://")

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(sync_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
