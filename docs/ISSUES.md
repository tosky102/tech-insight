# 推奨 Issue 一覧

GitHub / GitLab でリポジトリを作成したあと、以下を参考に Issue を作成し、ブランチと紐付けて作業できます。

---

## doc/ ドキュメント

| タイトル | ラベル案 | ブランチ | 説明 |
|----------|----------|----------|------|
| **設計ドキュメントの整備** | `documentation` | `doc/initial` | DB 設計書・API 設計書・実装説明を追加する |

---

## feat/ 機能

| タイトル | ラベル案 | ブランチ | 説明 |
|----------|----------|----------|------|
| **Phase1: Backend API 実装** | `enhancement`, `backend` | `feat/backend` | FastAPI / PostgreSQL / pgvector / Embedding による記事 CRUD・検索 API |
| **Phase1: Frontend 実装** | `enhancement`, `frontend` | `feat/frontend` | Next.js による記事一覧・詳細・作成・編集・削除・検索 UI |

---

## fix/ 修正（今後用）

| タイトル | ラベル案 | ブランチ | 説明 |
|----------|----------|----------|------|
| **Docker 環境での JSX 型エラー対応** | `bug`, `frontend` | `fix/docker-jsx` | node_modules がマウントされない場合の global.d.ts フォールバック |

---

## 使い方

1. 上記の「タイトル」で Issue を作成する（ラベルは任意で付与）
2. 対応するブランチで作業し、コミット
3. プルリクエストの説明に `Closes #1` のように Issue 番号を記載してマージ
