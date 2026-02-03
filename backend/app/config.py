"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from environment."""

    database_url: str = "postgresql+asyncpg://techinsight:techinsight@localhost:5432/techinsight"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384  # all-MiniLM-L6-v2
    articles_csv_path: str = "data/articles.csv"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
