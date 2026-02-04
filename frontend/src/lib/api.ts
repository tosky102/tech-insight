// API サーバーのベース URL
// NOTE: ブラウザから直接バックエンドを叩くため、ホスト側の 8000 番ポートを指す
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 共通の HTTP リクエスト関数
 *
 * - パスが絶対 URL（http で始まる）の場合はそのまま使用
 * - 相対パスの場合は API_BASE を前置してバックエンドに送る
 * - JSON を前提とした Content-Type ヘッダを自動付与
 * - 4xx/5xx の場合は `detail` を含むエラーメッセージを投げる
 * - 204 No Content の場合は undefined を返す
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    // FastAPI 標準の { detail: string | [{ msg: string }]} 形式を想定してエラーメッセージを抽出
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      Array.isArray(err.detail)
        ? err.detail[0]?.msg ?? res.statusText
        : err.detail ?? res.statusText
    );
  }
  // DELETE などで 204 が返るケース
  if (res.status === 204) return undefined as T;
  return res.json();
}

// バックエンドの /articles 系エンドポイントに対応するクライアント関数群
export const api = {
  /**
   * 記事一覧 / キーワード検索
   *
   * - page / page_size によるページング
   * - keyword が指定されている場合はタイトル・本文・カテゴリ・著者に対する LIKE 検索
   */
  getArticles: (params: {
    page?: number;
    page_size?: number;
    keyword?: string;
    sort?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.page != null) sp.set("page", String(params.page));
    if (params.page_size != null) sp.set("page_size", String(params.page_size));
    if (params.keyword) sp.set("keyword", params.keyword);
    if (params.sort) sp.set("sort", params.sort);
    return request<import("@/types/article").ArticleListResponse>(
      `/articles?${sp}`
    );
  },
  /**
   * セマンティック検索（AI 検索）
   *
   * - q: 自然言語クエリ
   * - page / page_size でページング
   * - 類似度の高い順に ArticleListResponse を返す
   */
  searchSemantic: (
    q: string,
    params?: { page?: number; page_size?: number }
  ) => {
    const sp = new URLSearchParams({ q });
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.page_size != null)
      sp.set("page_size", String(params.page_size ?? 20));
    return request<import("@/types/article").ArticleListResponse>(
      `/articles/search/semantic?${sp}`
    );
  },
  /** 単一記事の取得 */
  getArticle: (id: number) =>
    request<import("@/types/article").Article>(`/articles/${id}`),
  /** 記事の新規作成 */
  createArticle: (data: import("@/types/article").ArticleCreateInput) =>
    request<import("@/types/article").Article>("/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** 記事の更新（差分のみ送信可能） */
  updateArticle: (
    id: number,
    data: import("@/types/article").ArticleUpdateInput
  ) =>
    request<import("@/types/article").Article>(`/articles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  /** 記事の削除 */
  deleteArticle: (id: number) =>
    request<void>(`/articles/${id}`, { method: "DELETE" }),
  /** 記事クリックのログを送信（失敗してもUIには影響させない想定） */
  logClick: (params: { articleId: number; mode: string; query?: string }) =>
    request<void>("/metrics/click", {
      method: "POST",
      body: JSON.stringify({
        article_id: params.articleId,
        mode: params.mode,
        query: params.query ?? null,
      }),
    }),
};
