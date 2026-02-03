# TechInsight

AI 搭載型ナレッジベース「TechInsight」のリポジトリです。技術記事の CRUD とキーワード検索・セマンティック検索を提供する Web アプリケーションです。

## 技術スタック

- **Backend**: Python 3.12 / FastAPI
- **Frontend**: Next.js 14 / TypeScript / React
- **Database**: PostgreSQL 16 + pgvector
- **AI/ML**: sentence-transformers（all-MiniLM-L6-v2）による Embedding（API キー不要・ローカル完結）
- **Infrastructure**: Docker Compose

## 前提条件

- Docker と Docker Compose が利用できること
- （API キーは不要です。Embedding はローカルモデルを使用します）

## 起動方法

リポジトリのルートで以下を実行してください。

```bash
docker compose up --build
```

- 初回起動時、Backend で sentence-transformers のモデルをダウンロードするため、**数分程度**かかることがあります。
- 起動が完了すると以下で利用できます。
  - **Web アプリ**: http://localhost:3000
  - **API**: http://localhost:8000
  - **API ドキュメント**: http://localhost:8000/docs

## 起動時の流れ

1. **DB**: PostgreSQL（pgvector 拡張あり）が起動し、ヘルスチェックで準備完了を待つ
2. **Backend**: マイグレーション（`alembic upgrade head`）→ 記事データ投入（`data/articles.csv` またはサンプル生成）→ Uvicorn 起動
3. **Frontend**: Next.js 開発サーバー起動

## データの投入について

- **CSV を用意する場合**: プロジェクトルートの `data/articles.csv` を配置してください。
  - 形式: 1 行目をヘッダーとし、**`id`, `title`, `content`, `author`, `category`, `published_at`** のカラムを持つ CSV（UTF-8 推奨）
  - `published_at` は DB の `created_at` および `updated_at` にそのまま登録されます（ISO 8601 や `YYYY-MM-DD HH:MM:SS` などに対応）
  - `id` が数値の場合はその値を記事 ID として使用します（省略時は DB が自動採番）
  - `author` は著者名（任意）
  - 既に DB に記事が存在する場合は投入をスキップします（再投入したい場合は DB を初期化してください）

## DB の再マイグレート

スキーマを一度落としてから作り直し、必要に応じてデータを再投入する手順です。**Docker Compose で Backend が起動している状態**で、プロジェクトルートから実行してください。

```bash
# 1. マイグレーションをすべて戻す（テーブル削除）
docker compose exec backend alembic downgrade base

# 2. 最新までマイグレーションを適用（テーブル再作成）
docker compose exec backend alembic upgrade head

# 3. （任意）CSV からデータを再投入する場合
docker compose exec backend python -m app.scripts.load_articles
```

- 手順 3 は「既に記事が存在する場合はスキップ」するため、再投入したいときだけ実行すればよいです。
- DB のボリュームごと初期化したい場合は、`docker compose down -v` でボリュームを削除してから `docker compose up --build` で起動し直してください。

## 主な機能

- **記事一覧・キーワード検索**: タイトル・本文・カテゴリ・著者での部分一致検索
- **セマンティック検索（AI 検索）**: 自然言語クエリで意味が近い記事を検索
- **記事詳細表示**: 一覧から選択してモーダルで全文表示
- **管理機能**: 記事の新規作成・編集・削除（モーダル／フォーム）

## API 一覧（概要）

バックエンドの主要な記事 API は次のとおりです。詳細なスキーマやレスポンス例は `docs/API_DESIGN.md` を参照してください。

| メソッド | パス                         | 説明                                   | 主なクエリ / ボディ                     |
|----------|------------------------------|----------------------------------------|-----------------------------------------|
| GET      | `/articles`                  | 記事一覧取得＋キーワード検索           | `page`, `page_size`, `keyword`, `sort` |
| GET      | `/articles/search/semantic`  | セマンティック検索（AI 検索）         | `q`, `page`, `page_size`               |
| GET      | `/articles/{id}`             | 単一記事の取得                         | `id`（パスパラメータ）                 |
| POST     | `/articles`                  | 記事の新規作成                         | `title`, `content`, `author`, `category` |
| PATCH    | `/articles/{id}`             | 記事の更新（部分更新）                 | 上記フィールドのいずれか（差分のみ）   |
| DELETE   | `/articles/{id}`             | 記事の削除                             | `id`（パスパラメータ）                 |


詳細は [docs/API_DESIGN.md](docs/API_DESIGN.md) を参照してください。

## 画面構成（サイトマップ）

| 画面                         | パス        | 説明                                   |
|------------------------------|------------|----------------------------------------|
| トップ（記事一覧＋検索）    | `/`        | 記事一覧・キーワード/AI検索・カテゴリフィルタ |
| 管理画面（記事CRUD）        | `/admin`   | 記事の新規作成・編集・削除を行う管理用画面 |
| 記事詳細パネル              | `/` 内右側 | 一覧で選択した記事の詳細を表示（同一ページ内） |
| Backend API ドキュメント    | `/docs`    | FastAPI の自動生成 API ドキュメント   |


## ドキュメント

- [簡易 DB 設計書](docs/DB_DESIGN.md)
- [簡易 API 設計書](docs/API_DESIGN.md)
- [実装の説明・工夫した点](docs/IMPLEMENTATION.md)
- [推奨 Issue 一覧](docs/ISSUES.md)

## ディレクトリ構成（概要）

```
TechInsight/
├── backend/          # FastAPI アプリ
│   ├── app/
│   │   ├── api/      # エンドポイント
│   │   ├── crud/     # DB 操作
│   │   ├── models/   # SQLAlchemy モデル
│   │   ├── schemas/  # Pydantic スキーマ
│   │   ├── services/ # Embedding など
│   │   └── scripts/  # 記事投入スクリプト
│   └── alembic/      # マイグレーション
├── frontend/         # Next.js アプリ
│   └── src/
│       ├── app/      # ページ・レイアウト
│       ├── components/ # UI・記事関連コンポーネント
│       ├── lib/      # API クライアント
│       └── types/    # 型定義
├── data/             # articles.csv を置く場所
├── docs/             # DB/API 設計書・実装説明
└── docker-compose.yml
```

## ローカル開発（Docker を使わない場合）

- **DB**: ローカルで PostgreSQL + pgvector を起動し、`backend/.env` で `DATABASE_URL` を設定
- **Backend**: `cd backend && pip install -r requirements.txt && alembic upgrade head && python -m app.scripts.load_articles && uvicorn app.main:app --reload`
- **Frontend**: `cd frontend && npm install && npm run dev`（`.env.local` で `NEXT_PUBLIC_API_URL=http://localhost:8000` を設定）

## ライセンス

本リポジトリはコーディング試験用の提出物です。
