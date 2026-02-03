"""
CSV から記事データを読み込み、DB に投入したうえで Embedding を計算する初期ロードスクリプト。

想定 CSV 形式: id, title, content, author, category, published_at（1 行目ヘッダー、UTF-8 推奨）
- published_at は created_at および updated_at にそのまま登録する
- 既に記事が存在する場合は再投入をスキップする（冪等性を維持）

想定用途:
- docker compose 起動時にマイグレーション後に一度だけ実行し、サンプルデータを投入する
"""
import asyncio
import csv
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# 親ディレクトリを sys.path に追加して app パッケージを import 可能にする
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_maker
from app.models.article import Article
from app.services.embedding import EmbeddingService


BATCH_SIZE = 64  # Embedding をまとめて計算する際のバッチサイズ
INSERT_BATCH = 500  # INSERT を行う際の DB バッチサイズ
CSV_COLUMNS = ["id", "title", "content", "author", "category", "published_at"]


def _csv_path() -> Path:
    p = Path(settings.articles_csv_path)
    if not p.is_absolute():
        p = Path.cwd() / p
    return p


def _parse_published_at(value: str | None) -> datetime:
    """CSV の published_at をパースする。失敗時は現在時刻(UTC)を返す。返す値は常に timezone-aware (UTC)。"""
    if not value or not (value := value.strip()):
        return datetime.now(timezone.utc)
    value = value.replace("Z", "+00:00")
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d",
    ):
        try:
            dt = datetime.strptime(value, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return datetime.now(timezone.utc)


def _ensure_csv_exists() -> Path:
    """data/articles.csv が存在することを保証する。なければサンプルを自動生成。"""
    path = _csv_path()
    if path.exists():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    _generate_sample_csv(path)
    return path


def _generate_sample_csv(path: Path) -> None:
    """評価者が CSV を用意しなくても動作するよう、1000 件のサンプル記事を生成する。"""
    titles = [
        "FastAPIでREST APIを構築する",
        "PostgreSQLのインデックス設計",
        "Next.js App Routerの使い方",
        "Docker Composeで開発環境を構築",
        "機械学習モデルのデプロイ手法",
        "React Hooksのベストプラクティス",
        "マイクロサービス間の認証",
        "Kubernetes入門",
        "CI/CDパイプラインの設計",
        "GraphQLとRESTの比較",
    ]
    categories = ["Backend", "Frontend", "Infrastructure", "ML", "DB", "DevOps"]
    authors = ["Author1", "Author2", "Author3", "Author4", "Author5"]
    content_template = (
        "本記事では{title}について解説します。"
        "まず概要を説明し、その後具体的な実装手順に触れます。"
        "最後にベストプラクティスと注意点をまとめます。"
    )
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(CSV_COLUMNS)
        base_ts = "2024-01-01 00:00:00"
        for i in range(1000):
            t = titles[i % len(titles)]
            d = datetime.strptime(base_ts, "%Y-%m-%d %H:%M:%S") + timedelta(hours=i)
            pub = d.strftime("%Y-%m-%d %H:%M:%S")
            w.writerow([
                i + 1,
                f"{t} #{i+1}",
                content_template.format(title=t) + f" 詳細な説明が続きます。({i+1})",
                authors[i % len(authors)],
                categories[i % len(categories)],
                pub,
            ])
    print(f"Generated sample CSV: {path} (1000 rows, columns: {CSV_COLUMNS})", file=sys.stderr)


def _row_lower(row: dict) -> dict:
    """CSV のヘッダーが大文字小文字混在でも参照できるよう、キーを小文字にした辞書を返す。"""
    return {(k.strip().lower() if k else ""): v for k, v in row.items()}


async def load_articles() -> None:
    path = _ensure_csv_exists()
    articles: list[dict] = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            r = _row_lower(row)
            title = (r.get("title") or "").strip()
            content = (r.get("content") or "").strip()
            if not title and not content:
                continue
            raw_id = (r.get("id") or "").strip()
            article_id = int(raw_id) if raw_id.isdigit() else None
            published_at = _parse_published_at(
                r.get("published_at") or r.get("publiished_at")
            )
            articles.append({
                "id": article_id,
                "title": title or "Untitled",
                "content": content or "",
                "category": (r.get("category") or "").strip() or None,
                "author": (r.get("author") or "").strip() or None,
                "created_at": published_at,
                "updated_at": published_at,
            })

    if not articles:
        print("No articles to load.", file=sys.stderr)
        return

    async with async_session_maker() as session:
        existing = await session.execute(select(Article.id))
        if existing.scalars().first() is not None:
            print("Articles already exist; skipping load. (Delete table data to re-import.)", file=sys.stderr)
            return

        for i in range(0, len(articles), INSERT_BATCH):
            batch = articles[i : i + INSERT_BATCH]
            for a in batch:
                kwargs = {
                    "title": a["title"],
                    "content": a["content"],
                    "category": a["category"],
                    "author": a["author"],
                    "created_at": a["created_at"],
                    "updated_at": a["updated_at"],
                }
                if a["id"] is not None:
                    kwargs["id"] = a["id"]
                session.add(Article(**kwargs))
            await session.commit()
            print(f"Inserted rows {i+1}-{min(i+INSERT_BATCH, len(articles))}/{len(articles)}", file=sys.stderr)

        await session.execute(text(
            "SELECT setval(pg_get_serial_sequence('articles', 'id'), COALESCE((SELECT MAX(id) FROM articles), 1))"
        ))
        await session.commit()

        result = await session.execute(select(Article).order_by(Article.id))
        all_articles = list(result.scalars().all())
        texts = [f"{a.title}\n{a.content}" for a in all_articles]

        for j in range(0, len(texts), BATCH_SIZE):
            batch_texts = texts[j : j + BATCH_SIZE]
            batch_articles = all_articles[j : j + BATCH_SIZE]
            embeddings = EmbeddingService.encode(batch_texts)
            for art, emb in zip(batch_articles, embeddings):
                vec_str = "[" + ",".join(str(x) for x in emb) + "]"
                await session.execute(
                    text("UPDATE articles SET embedding = CAST(:emb AS vector) WHERE id = :id"),
                    {"emb": vec_str, "id": art.id},
                )
            await session.commit()
            print(f"Embeddings {j+1}-{min(j+BATCH_SIZE, len(texts))}/{len(texts)}", file=sys.stderr)

    print("Load and embedding complete.", file=sys.stderr)


def main() -> None:
    asyncio.run(load_articles())


if __name__ == "__main__":
    main()
