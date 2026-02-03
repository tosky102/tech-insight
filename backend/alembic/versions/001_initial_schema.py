"""Initial schema: pgvector extension and articles table.

Revision ID: 001
Revises:
Create Date: 2025-02-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "articles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=True),
        sa.Column("author", sa.Text(), nullable=True),
        sa.Column("embedding", Vector(384), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_articles_title"), "articles", ["title"], unique=False)
    op.create_index(op.f("ix_articles_category"), "articles", ["category"], unique=False)
    op.create_index(op.f("ix_articles_author"), "articles", ["author"], unique=False)
    # lists=1 で空テーブルでも作成可能。データ投入後は 1万件想定で lists を増やすと検索が効率化される
    op.execute(
        """
        CREATE INDEX ix_articles_embedding ON articles
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 1)
        """
    )


def downgrade() -> None:
    op.drop_index("ix_articles_embedding", table_name="articles")
    op.drop_index("ix_articles_author", table_name="articles")
    op.drop_index("ix_articles_category", table_name="articles")
    op.drop_index("ix_articles_title", table_name="articles")
    op.drop_table("articles")
    op.execute("DROP EXTENSION IF EXISTS vector")
