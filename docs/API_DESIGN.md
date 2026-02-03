# TechInsight 簡易API設計書

## ベースURL
- ローカル: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`

## 共通

- **Content-Type**: `application/json`
- **エラー**: 4xx/5xx 時は JSON で `detail` を返却。

---

## 記事 (Articles)

### 一覧・キーワード検索

```
GET /articles
```

| クエリ | 型 | 必須 | 説明 |
|--------|-----|------|------|
| page | integer | No | ページ番号（既定: 1） |
| page_size | integer | No | 1ページあたり件数（既定: 20, 最大: 100） |
| keyword | string | No | タイトル・本文・カテゴリ・著者に対する部分一致 |

**レスポンス例**

```json
{
  "items": [
    {
      "id": 1,
      "title": "タイトル",
      "content": "本文",
      "category": "Backend",
      "author": "著者名",
      "created_at": "2025-02-02T00:00:00Z",
      "updated_at": "2025-02-02T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

---

### セマンティック検索

```
GET /articles/search/semantic
```

| クエリ | 型 | 必須 | 説明 |
|--------|-----|------|------|
| q | string | Yes | 自然言語クエリ（意味的類似度で検索） |
| page | integer | No | ページ番号（既定: 1） |
| page_size | integer | No | 1ページあたり件数（既定: 20, 最大: 100） |

**レスポンス**: 一覧と同じ形式（`items`, `total`, `page`, `page_size`）。類似度の高い順。

---

### 記事詳細取得

```
GET /articles/{article_id}
```

**レスポンス**: 記事オブジェクト1件。存在しない場合は 404。

---

### 記事作成

```
POST /articles
```

**Body**

```json
{
  "title": "タイトル",
  "content": "本文",
  "category": "カテゴリ（任意）",
  "author": "著者（任意）"
}
```

**レスポンス**: 作成された記事（201）。作成時に embedding を自動計算・保存。

---

### 記事更新

```
PATCH /articles/{article_id}
```

**Body**: 変更したいフィールドのみ送信可能。

```json
{
  "title": "新しいタイトル",
  "content": "新しい本文"
}
```

**レスポンス**: 更新後の記事。更新時に embedding を再計算・保存。

---

### 記事削除

```
DELETE /articles/{article_id}
```

**レスポンス**: 204 No Content。存在しない場合は 404。

---

## ヘルスチェック

```
GET /health
```

**レスポンス**: `{ "status": "ok" }`
