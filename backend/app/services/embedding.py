"""Embedding service using sentence-transformers (local, no API key).

埋め込みベクトル生成用のサービスクラス。

特徴:
- sentence-transformers を利用し、外部 API キー不要でローカル完結
- モデルのロードはプロセス内で 1 回だけ行う（簡易なシングルトン）
"""
from typing import List

from app.config import settings


class EmbeddingService:
    """セマンティック検索向けの埋め込みモデルを提供するシングルトンサービス。"""

    _instance = None
    _model = None

    @classmethod
    def get_model(cls):
        """埋め込みモデルを取得する。未ロードの場合は初回ロードを行う。"""
        if cls._model is None:
            from sentence_transformers import SentenceTransformer
            cls._model = SentenceTransformer(settings.embedding_model)
        return cls._model

    @classmethod
    def encode(cls, texts: List[str]) -> List[List[float]]:
        """Encode texts to vectors. Batch for efficiency."""
        if not texts:
            return []
        model = cls.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=len(texts) > 100)
        return embeddings.tolist()

    @classmethod
    def encode_single(cls, text: str) -> List[float]:
        """Encode a single text."""
        return cls.encode([text])[0]
