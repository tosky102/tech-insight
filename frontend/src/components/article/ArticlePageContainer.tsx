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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

export interface ArticlePageContainerProps {
  /** false のときは閲覧のみ（新規作成・編集・削除なし）。トップページ用。 */
  allowCrud?: boolean;
  /** ページ見出し（未指定時は "TechInsight"） */
  title?: string;
}

export function ArticlePageContainer({
  allowCrud = true,
  title = "TechInsight",
}: ArticlePageContainerProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [sort, setSort] = useState<SortOption>("newest");
  // 一覧ヘッダーで選択するカテゴリ（現状は UI 表示のみ。将来的にサーバーサイド絞り込みへ拡張可能）
  const [categoryFilter, setCategoryFilter] = useState<string>("");
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
  const [prefetchedArticleId, setPrefetchedArticleId] = useState<number | null>(
    null
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  // クエリパラメータ ?article=ID が指定されている場合、その記事を自動選択する。
  // 一覧に存在しなければ個別取得して先頭に挿入し、必ず画面内に表示する。
  useEffect(() => {
    const idParam = searchParams?.get("article");
    if (!idParam) return;
    const id = Number(idParam);
    if (!Number.isInteger(id)) return;
    const found = articles.find((a) => a.id === id);
    if (found) {
      setSelectedArticle(found);
      return;
    }
    if (prefetchedArticleId === id) return;
    setPrefetchedArticleId(id);
    void (async () => {
      try {
        const article = await api.getArticle(id);
        setArticles((prev) => {
          if (prev.some((a) => a.id === article.id)) {
            return prev;
          }
          return [article, ...prev];
        });
        setSelectedArticle(article);
      } catch (e) {
        console.error("failed to preload article from URL", e);
      }
    })();
  }, [searchParams, articles, prefetchedArticleId]);

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
   *   - 直近の AI 検索クエリがあればそれで再検索
   *   - なければ直近のキーワード検索文字列を AI 検索クエリとして実行
   *   - いずれも無い場合は一覧を空にし、「マッチした記事のみ表示」という仕様を担保
   * - keyword へ戻す:
   *   - lastKeyword があればそのキーワード検索結果、
   *   - なければ lastSemanticQuery をキーワードとして使って再検索、
   *   - どちらも無ければ全件を再取得
   */
  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      setSearchMode(newMode);
      if (newMode === "semantic") {
        if (lastSemanticQuery.trim().length > 0) {
          // すでに AI 検索を行っている場合は、そのクエリを使って再検索
          fetchSemantic(lastSemanticQuery, 1);
        } else if (lastKeyword.trim().length > 0) {
          // 直近のキーワード検索文字列を、そのまま AI 検索クエリとして扱う
          setLastSemanticQuery(lastKeyword);
          setLastKeyword("");
          fetchSemantic(lastKeyword, 1);
        } else {
          // どちらの履歴もない場合は一覧を空にして「マッチした記事のみ」モードにする
          setArticles([]);
          setTotal(0);
          setPage(1);
        }
        if (lastKeyword.trim().length > 0) {
          // 直近のキーワード検索がある場合はそれを再実行
          fetchList(1, lastKeyword, false, sort);
        } else if (lastSemanticQuery.trim().length > 0) {
          // AI検索から戻る場合は、セマンティック検索で使ったクエリ文字列を
          // 通常のキーワード検索として流用する
          setLastKeyword(lastSemanticQuery);
          fetchList(1, lastSemanticQuery, false, sort);
        } else {
          // どの履歴もない場合は全件取得
          fetchList(1, undefined, false, sort);
        }
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

  /** 記事クリック時にメトリクスも送るラッパー（失敗しても await せず UI 優先） */
  const handleArticleClickWithMetrics = useCallback(
    (article: Article) => {
      // 先にUI側の選択を更新
      setSelectedArticle(article);
      // メトリクス送信は fire-and-forget で行う
      const mode = searchMode;
      const query =
        mode === "semantic"
          ? lastSemanticQuery || undefined
          : lastKeyword || undefined;
      // エラーは握りつぶす
      void api
        .logClick({ articleId: article.id, mode, query })
        .catch((e) => console.error("failed to log click", e));
      // URL に ?article=ID を反映して共有しやすくする
      const sp = new URLSearchParams(searchParams ?? undefined);
      sp.set("article", String(article.id));
      router.push(`${pathname}?${sp.toString()}`);
    },
    [searchMode, lastSemanticQuery, lastKeyword, router, pathname, searchParams]
  );

  // カテゴリボタン押下時: キーワード検索モードに切り替え、カテゴリ名で検索を実行する
  const handleCategoryFilterChange = useCallback(
    (value: string) => {
      setCategoryFilter(value);
      setSearchMode("keyword");
      // 空文字なら全件、それ以外はカテゴリ名をキーワードとして検索
      handleKeywordSearch(value);
    },
    [handleKeywordSearch]
  );

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

  // 検索結果 0 件時に、他方の検索モードへ切り替えるためのボタン表示制御
  const isEmpty = !isLoading && articles.length === 0;
  const canSwitchFromKeyword =
    isEmpty && searchMode === "keyword" && lastKeyword.trim().length > 0;
  const canSwitchFromSemantic =
    isEmpty && searchMode === "semantic" && lastSemanticQuery.trim().length > 0;

  const emptyActionLabel = canSwitchFromKeyword
    ? "AI検索に切り替える"
    : canSwitchFromSemantic
    ? "キーワード検索に切り替える"
    : undefined;

  const handleEmptyAction =
    canSwitchFromKeyword && !isLoading
      ? () => {
          // キーワード検索で 0 件だった場合:
          // - 検索モードを semantic に切り替え
          // - 直近のキーワード文字列を AI 検索クエリとしてそのまま投げる
          setSearchMode("semantic");
          if (lastKeyword.trim().length > 0) {
            handleSemanticSearch(lastKeyword);
          }
        }
      : canSwitchFromSemantic && !isLoading
      ? () => {
          // AI 検索で 0 件だった場合:
          // - 検索モードを keyword に切り替え
          // - 直近の AI クエリ文字列をキーワード検索として実行
          setSearchMode("keyword");
          if (lastSemanticQuery.trim().length > 0) {
            handleKeywordSearch(lastSemanticQuery);
          }
        }
      : undefined;

  const emptyMessage =
    searchMode === "semantic"
      ? !lastSemanticQuery
        ? "検索キーワードを入力してAI検索を実行してください。マッチした記事のみ表示されます。"
        : "該当する記事がありませんでした。"
      : lastKeyword.trim().length > 0
      ? "該当する記事がありませんでした。"
      : undefined;

  // 現在の検索モードに応じて、ハイライトに使うクエリ文字列を決定
  const highlightQuery =
    searchMode === "semantic" ? lastSemanticQuery : lastKeyword;

  return (
    <div className="mx-auto flex h-full w-full max-w-full flex-col overflow-hidden px-4 py-8 pb-4 sm:px-6 md:max-w-[1040px] lg:max-w-[1600px] lg:px-8">
      <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {allowCrud && <Button onClick={handleCreateClick}>新規記事</Button>}
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
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto lg:min-h-[400px] lg:max-h-[calc(100vh-16rem)] max-h-[40vh]">
          <ArticleList
            articles={articles}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onArticleClick={handleArticleClick}
            onArticleClickWithMetrics={handleArticleClickWithMetrics}
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            sort={sort}
            onSortChange={setSort}
            selectedArticleId={selectedArticle?.id ?? null}
            emptyMessage={emptyMessage}
            emptyActionLabel={emptyActionLabel}
            emptyActionDisabled={isLoading}
            onEmptyAction={handleEmptyAction}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={handleCategoryFilterChange}
            highlightQuery={highlightQuery}
          />
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden lg:flex-none lg:shrink-0">
          <ArticleDetailPanel
            article={selectedArticle}
            onEdit={allowCrud ? handleEditFromDetail : undefined}
            onDelete={allowCrud ? handleDeleteClick : undefined}
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

      {allowCrud && (
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
      )}
    </div>
  );
}
