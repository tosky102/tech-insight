"""Add metrics tables for search and clicks.

Revision ID: 002
Revises: 001
Create Date: 2026-02-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  op.create_table(
      "search_logs",
      sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
      sa.Column("query", sa.Text(), nullable=False),
      sa.Column("mode", sa.String(length=32), nullable=False),
      sa.Column(
          "result_count",
          sa.Integer(),
          nullable=False,
          server_default="0",
      ),
      sa.Column(
          "created_at",
          sa.DateTime(timezone=True),
          server_default=sa.text("now()"),
          nullable=False,
      ),
      sa.PrimaryKeyConstraint("id"),
  )
  op.create_index(
      "ix_search_logs_created_at",
      "search_logs",
      ["created_at"],
      unique=False,
  )
  op.create_index(
      "ix_search_logs_mode_created_at",
      "search_logs",
      ["mode", "created_at"],
      unique=False,
  )

  op.create_table(
      "article_click_logs",
      sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
      sa.Column("article_id", sa.Integer(), nullable=False),
      sa.Column("mode", sa.String(length=32), nullable=False),
      sa.Column("query", sa.Text(), nullable=True),
      sa.Column(
          "created_at",
          sa.DateTime(timezone=True),
          server_default=sa.text("now()"),
          nullable=False,
      ),
      sa.ForeignKeyConstraint(
          ["article_id"],
          ["articles.id"],
          ondelete="CASCADE",
      ),
      sa.PrimaryKeyConstraint("id"),
  )
  op.create_index(
      "ix_article_click_logs_article_id_created_at",
      "article_click_logs",
      ["article_id", "created_at"],
      unique=False,
  )


def downgrade() -> None:
  op.drop_index(
      "ix_article_click_logs_article_id_created_at",
      table_name="article_click_logs",
  )
  op.drop_table("article_click_logs")
  op.drop_index(
      "ix_search_logs_mode_created_at",
      table_name="search_logs",
  )
  op.drop_index(
      "ix_search_logs_created_at",
      table_name="search_logs",
  )
  op.drop_table("search_logs")

