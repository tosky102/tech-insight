# TechInsight 簡易DB設計書

## 概要
技術記事を格納し、キーワード検索とセマンティック検索（ベクトル類似度）をサポートするためのスキーマです。約1万件を想定したインデックス設計を行っています。

## ER（概念）

```
[articles]
- id (PK)
- title, content, category, author
- embedding (vector 384次元)
- created_at, updated_at
```

## テーブル定義

### articles

| カラム名 | 型 | NULL | 説明 |
|----------|-----|------|------|
| id | SERIAL / INTEGER | NO | 主キー |
| title | TEXT | NO | 記事タイトル |
| content | TEXT | NO | 本文 |
| category | TEXT | YES | カテゴリ |
| author | TEXT | YES | 著者 |
| embedding | VECTOR(384) | YES | 埋め込みベクトル（all-MiniLM-L6-v2） |
| created_at | TIMESTAMPTZ | NO | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | 更新日時 |

## インデックス

| 名前 | 対象 | 種別 | 目的 |
|------|------|------|------|
| articles_pkey | id | PRIMARY KEY | 主キー |
| ix_articles_title | title | B-tree | キーワード検索・一覧 |
| ix_articles_category | category | B-tree | カテゴリ絞り込み |
| ix_articles_author | author | B-tree | 著者絞り込み |
| ix_articles_embedding | embedding | IVFFlat (vector_cosine_ops, lists=100) | セマンティック検索（コサイン距離） |

## 拡張

- **pgvector**: ベクトル型と IVFFlat インデックス用に使用。

## 設計上の考慮

1. **1万件想定**: IVFFlat の `lists=100` は約1万件を目安に設定。データ量が大きく増える場合は `lists` の再設定を検討。
2. **embedding**: 新規・更新時に Backend で sentence-transformers により生成し保存。検索時はクエリを同モデルでベクトル化し、コサイン距離で類似記事を取得。
3. **NULL**: embedding は初回投入前や過去データで未計算の場合は NULL を許容。
