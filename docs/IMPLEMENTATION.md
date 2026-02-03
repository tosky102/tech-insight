# TechInsight 実装の説明・工夫した点

## 概要
技術記事データを基盤としたナレッジマネジメントシステム「TechInsight」の実装説明です。要件に沿って CRUD・セマンティック検索・Docker Compose による一括起動を実装し、コンポーネント化・保守性・スケーラビリティを意識した設計にしています。

---

## UI/UX の観点

- **コンポーネント分割**: 一覧・検索・詳細・管理を `ArticleCard`, `ArticleList`, `SearchBar`, `ArticleDetailModal`, `ArticleFormModal`, `ArticlePageContainer` に分離し、責務を明確にしました。再利用とテストをしやすくしています。
- **検索モード切替**: キーワード検索とセマンティック検索をタブで切り替え可能にし、用途に応じて選べるようにしました。
- **モーダル**: 詳細表示・作成・編集はモーダルで行い、一覧を見たまま操作できるようにしました。Esc で閉じる・オーバーレイクリックで閉じるに対応しています。
- **ローディング・フィードバック**: 検索・作成・更新・削除時にローディング表示やボタンの無効化を行い、二重送信を防ぎつつ状態を伝えるようにしました。
- **アクセシビリティ**: モーダルの `role="dialog"`, `aria-modal`, キーボード操作（Enter/Space でカード選択、Esc で閉じる）を考慮しています。
- **レスポンシブ**: 一覧をグリッドで表示し、画面幅に応じてカラム数が変わるようにしています。

---

## DB の観点

- **1万件想定**: `articles` に `title`, `content`, `category`, `author` に B-tree インデックスを張り、キーワード検索・一覧のクエリ効率を確保しました。
- **セマンティック検索**: pgvector の `VECTOR(384)` と IVFFlat インデックス（`vector_cosine_ops`, `lists=100`）で、約1万件を想定した類似度検索ができるようにしました。
- **マイグレーション**: Alembic でスキーマをバージョン管理し、`docker compose up` 時に `alembic upgrade head` で適用するようにしました。
- **CSV 投入**: `data/articles.csv` が無い場合はサンプル 1000 件を生成して投入するようにし、評価者が CSV を用意していなくても動作するようにしました。CSV 形式は `title`, `content`, `category`, `author` を想定しています。

---

## チーム開発を意識した観点

- **ディレクトリ構成**: Backend は `app/` 配下で `api/`, `crud/`, `models/`, `schemas/`, `services/`, `scripts/` に分け、Frontend は `src/components/ui/`, `src/components/article/`, `src/lib/`, `src/types/` に分け、役割ごとにファイルを探しやすくしました。
- **型・スキーマ**: Pydantic で API 入出力を定義し、Frontend では `Article`, `ArticleListResponse` などの型を共有し、API 契約のズレを防ぎやすくしています。
- **単一責務**: CRUD は `crud/article.py`、Embedding は `services/embedding.py`、API は `api/articles.py` に集約し、変更の影響範囲を限定しました。
- **設定の外部化**: `pydantic-settings` で `DATABASE_URL`, `EMBEDDING_MODEL` などを環境変数から読み、環境ごとの違いをコードに書かずに済むようにしました。

---

## 保守運用・スケーラビリティの考慮

- **Embedding はローカル**: sentence-transformers（all-MiniLM-L6-v2）を採用し、API キー不要でローカル完結するようにしました。評価者がそのまま再現できます。
- **接続プール**: SQLAlchemy の `pool_size=10`, `max_overflow=20` で接続数を制御し、負荷に応じた調整がしやすいようにしました。
- **バッチ処理**: 記事投入時は Embedding をバッチで計算し、メモリと時間のバランスを取っています。
- **インデックス**: データ量が 1 万件を超えて増える場合は、IVFFlat の `lists` の見直しや、必要に応じて HNSW への変更を検討できる設計にしています。
- **ヘルスチェック**: `GET /health` で API の生存確認ができるようにしました。DB のヘルスチェックは `docker compose` の `depends_on` で DB の起動完了を待つようにしています。

---

## その他の観点

- **CORS**: FastAPI で `localhost:3000` などを許可し、フロントから API を呼び出しやすくしました。
- **エラーハンドリング**: API の 4xx/5xx を Frontend で受け取り、`detail` を表示するようにしています（現状はコンソールログ中心ですが、拡張しやすい形にしています）。
- **削除確認**: 記事削除時に `confirm` で確認を取るようにしました。
- **ページネーション**: 一覧・セマンティック検索ともに `page` / `page_size` でページネーションし、大量件数でも扱いやすくしました。

---

## 技術スタック

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, pgvector, sentence-transformers
- **Frontend**: Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS
- **DB**: PostgreSQL 16 + pgvector
- **Infrastructure**: Docker Compose（db, backend, frontend）

## 起動方法

```bash
docker compose up --build
```

- 初回は Backend で sentence-transformers のモデルダウンロードが発生するため、起動に数分かかることがあります。
- 起動後: フロント `http://localhost:3000`、API `http://localhost:8000`、API ドキュメント `http://localhost:8000/docs`。

## データについて

- `data/articles.csv` を配置すると、起動時にその CSV が投入されます（形式: `title`, `content`, `category`, `author`）。
- CSV が無い場合は、サンプル 1000 件が自動生成・投入されます。
