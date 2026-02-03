"use client";

/**
 * 記事一覧〜検索〜詳細表示までを束ねるページコンテナ
 *
 * - 左: 記事一覧（キーワード / AI 検索 + 無限スクロール）
 * - 右: 記事詳細パネル
 * - 上部: 検索バー / 新規作成ボタン
 *
 * ここでは「状態管理とデータ取得」に集中し、見た目は子コンポーネントに委譲する。
 */
import { useState, useCallback, useEffect } from "react";
import type {
  Article,
  ArticleCreateInput,
  ArticleUpdateInput,
} from "@/types/article";
import { api } from "@/lib/api";
import type { SortOption } from "@/constants/sort";
import { SearchBar, type SearchMode } from "./SearchBar";
import { ArticleList } from "./ArticleList";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import { ArticleFormModal, type ArticleFormMode } from "./ArticleFormModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// 一度に取得する記事件数（無限スクロールの 1 ページ分）
const PAGE_SIZE = 12;

export function ArticlePageContainer() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [sort, setSort] = useState<SortOption>("newest");
  const [lastKeyword, setLastKeyword] = useState("");
  const [lastSemanticQuery, setLastSemanticQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ArticleFormMode>("create");
  const [formInitial, setFormInitial] = useState<Article | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  /** 削除確認モーダルで対象にしている記事（null のときはモーダル非表示） */
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  /**
   * 記事一覧取得（キーワード検索含む）
   *
   * @param p        取得するページ番号
   * @param keyword  キーワード（未指定/空文字なら全件）
   * @param append   true の場合は既存一覧の末尾に追記（無限スクロール用）
   */
  const fetchList = useCallback(
    async (
      p: number,
      keyword?: string,
      append?: boolean,
      sortOverride?: SortOption
    ) => {
      setIsLoading(true);
      try {
        const res = await api.getArticles({
          page: p,
          page_size: PAGE_SIZE,
          keyword: keyword ?? undefined,
          sort: sortOverride ?? sort,
        });
        if (append) {
          setArticles((prev) => [...prev, ...res.items]);
        } else {
          setArticles(res.items);
        }
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        console.error(e);
        if (!append) {
          setArticles([]);
          setTotal(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [sort]
  );

  /**
   * セマンティック検索用の取得処理
   *
   * @param q       自然言語クエリ
   * @param p       ページ番号
   * @param append  true の場合は既存一覧に追記（無限スクロール用）
   */
  const fetchSemantic = useCallback(
    async (q: string, p: number = 1, append?: boolean) => {
      setIsLoading(true);
      try {
        const res = await api.searchSemantic(q, {
          page: p,
          page_size: PAGE_SIZE,
        });
        if (append) {
          setArticles((prev) => [...prev, ...res.items]);
        } else {
          setArticles(res.items);
        }
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        console.error(e);
        if (!append) {
          setArticles([]);
          setTotal(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // 初期表示時はキーワード無しで 1 ページ目を取得（「全記事一覧」）
    fetchList(1);
  }, [fetchList]);

  // 一覧が差し替わったとき、現在選択中の記事が一覧に含まれていなければ選択を解除する
  useEffect(() => {
    if (!selectedArticle) return;
    const stillInList = articles.some((a) => a.id === selectedArticle.id);
    if (!stillInList) setSelectedArticle(null);
  }, [articles, selectedArticle]);

  /**
   * キーワード検索実行時のハンドラ
   * - lastKeyword に保存し、以降の再フェッチや無限スクロールに利用する
   * - セマンティック検索の状態はリセットする
   */
  const handleKeywordSearch = useCallback(
    (keyword: string) => {
      setLastKeyword(keyword);
      setLastSemanticQuery("");
      fetchList(1, keyword, false, sort);
    },
    [fetchList, sort]
  );

  /**
   * AI 検索（セマンティック検索）実行時のハンドラ
   * - lastSemanticQuery にクエリを保存し、以降のページングやフォーム再送信時に再利用する
   * - キーワード検索状態はリセットする
   */
  const handleSemanticSearch = useCallback(
    (query: string) => {
      setLastSemanticQuery(query);
      setLastKeyword("");
      fetchSemantic(query, 1);
    },
    [fetchSemantic]
  );

  /**
   * 検索モード切り替え時のハンドラ
   *
   * - semantic へ切り替え:
   *   - まだ AI 検索を実行していない場合は一覧を空にし、「マッチした記事のみ表示」という仕様を担保
   * - keyword へ戻す:
   *   - lastKeyword があればそのキーワード検索結果、なければ全件を再取得
   */
  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      setSearchMode(newMode);
      if (newMode === "semantic") {
        if (!lastSemanticQuery) {
          setArticles([]);
          setTotal(0);
          setPage(1);
        }
      } else {
        fetchList(1, lastKeyword || undefined, false, sort);
      }
    },
    [lastSemanticQuery, lastKeyword, sort, fetchList]
  );

  /**
   * 無限スクロールの「次ページ読み込み」ハンドラ
   *
   * - lastSemanticQuery があれば AI 検索の次ページを追記
   * - なければキーワード検索（または全件）の次ページを追記
   */
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    if (lastSemanticQuery) {
      fetchSemantic(lastSemanticQuery, nextPage, true);
    } else {
      fetchList(nextPage, lastKeyword || undefined, true, sort);
    }
  }, [page, lastSemanticQuery, lastKeyword, sort, fetchList, fetchSemantic]);

  const handleArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
  }, []);

  const handleCreateClick = useCallback(() => {
    // 新規作成モードでフォームモーダルを開く
    setFormMode("create");
    setFormInitial(null);
    setFormOpen(true);
  }, []);

  const handleEditFromDetail = useCallback((article: Article) => {
    // 右側詳細パネルから編集ボタンが押されたとき、
    // 選択中の記事を初期値として編集モーダルを開く
    setFormMode("edit");
    setFormInitial(article);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: ArticleCreateInput | ArticleUpdateInput) => {
      setFormSubmitting(true);
      try {
        if (formMode === "create") {
          const created = await api.createArticle(data as ArticleCreateInput);
          setSelectedArticle(created);
          setArticles((prev) => [
            created,
            ...prev.filter((a) => a.id !== created.id),
          ]);
          setTotal((prev) => prev + 1);
        } else if (formInitial) {
          const updated = await api.updateArticle(
            formInitial.id,
            data as ArticleUpdateInput
          );
          setSelectedArticle((prev) =>
            prev?.id === formInitial.id ? updated : prev
          );
        }
        setFormOpen(false);
        // 編集後は検索条件を維持したまま 1 ページ目を再取得して整合性を保つ
        if (lastSemanticQuery) {
          fetchSemantic(lastSemanticQuery, 1);
        } else {
          fetchList(1, lastKeyword || undefined, false, sort);
        }
      } finally {
        setFormSubmitting(false);
      }
    },
    [
      formMode,
      formInitial,
      lastSemanticQuery,
      lastKeyword,
      sort,
      fetchList,
      fetchSemantic,
    ]
  );

  /** 詳細パネルの「削除」クリック時: 確認モーダルを開くだけ（実際の削除はモーダル内の「削除」で実行） */
  const handleDeleteClick = useCallback((article: Article) => {
    setArticleToDelete(article);
  }, []);

  /** 削除確認モーダルで「削除」を押したときの実行処理 */
  const handleConfirmDelete = useCallback(async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteArticle(articleToDelete.id);
      setArticleToDelete(null);
      setSelectedArticle(null);
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } finally {
      setIsDeleting(false);
    }
  }, [articleToDelete]);

  return (
    <div className="mx-auto flex h-full w-full max-w-full flex-col overflow-hidden px-4 py-8 sm:px-6 md:max-w-[1040px] lg:max-w-[1600px] lg:px-8">
      <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          TechInsight
        </h1>
        <Button onClick={handleCreateClick}>新規記事</Button>
      </header>

      <section className="mb-6 shrink-0">
        <SearchBar
          onKeywordSearch={handleKeywordSearch}
          onSemanticSearch={handleSemanticSearch}
          searchMode={searchMode}
          onModeChange={handleModeChange}
          isLoading={isLoading}
        />
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-4">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto lg:min-h-[400px] lg:max-h-[calc(100vh-200px)] max-h-[40vh]">
          <ArticleList
            articles={articles}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onArticleClick={handleArticleClick}
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            sort={sort}
            onSortChange={setSort}
            selectedArticleId={selectedArticle?.id ?? null}
            emptyMessage={
              searchMode === "semantic"
                ? !lastSemanticQuery
                  ? "検索キーワードを入力してAI検索を実行してください。マッチした記事のみ表示されます。"
                  : "該当する記事がありませんでした。"
                : undefined
            }
          />
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden lg:flex-none lg:shrink-0">
          <ArticleDetailPanel
            article={selectedArticle}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteClick}
            isDeleting={isDeleting}
          />
        </div>
      </section>

      <ArticleFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        initialData={formInitial}
        onSubmit={handleFormSubmit}
        isLoading={formSubmitting}
      />

      <Modal
        isOpen={articleToDelete != null}
        onClose={() => !isDeleting && setArticleToDelete(null)}
        title="削除の確認"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-slate-700">
            「{articleToDelete?.title}」を削除してもよろしいですか？
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setArticleToDelete(null)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              削除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
