"use client";

"use client";

/**
 * 記事一覧コンポーネント
 *
 * - 1 行 1 件のカードを縦に並べるレイアウト
 * - IntersectionObserver を利用して最下部に到達したら onLoadMore を呼び出し、
 *   無限スクロールで次ページを読み込む
 */
import { useEffect, useRef, useCallback } from "react";
import type { Article } from "@/types/article";
import { SORT_OPTIONS, type SortOption } from "@/constants/sort";
import { DEFAULT_CATEGORY_OPTIONS } from "@/constants/categories";
import { ArticleCard } from "./ArticleCard";
import { Button } from "@/components/ui/Button";

export type { SortOption };

export interface ArticleListProps {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
  onArticleClick: (article: Article) => void;
  onLoadMore: () => void;
  isLoading?: boolean;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  /** 現在選択中の記事 ID（一覧でハイライトするため） */
  selectedArticleId?: number | null;
  /** 記事0件時のメッセージ（未指定時はデフォルト文言） */
  emptyMessage?: string;
  /** 記事0件時に表示するアクションボタンのラベル（未指定時はボタン非表示） */
  emptyActionLabel?: string;
  /** 空状態ボタンの無効化フラグ */
  emptyActionDisabled?: boolean;
  /** 空状態ボタン押下時のハンドラ */
  onEmptyAction?: () => void;
  /** 一覧ヘッダー右側に表示するカテゴリフィルター（未指定時はセレクト非表示） */
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
}

export function ArticleList({
  articles,
  total,
  page,
  pageSize,
  onArticleClick,
  onLoadMore,
  isLoading = false,
  sort,
  onSortChange,
  selectedArticleId = null,
  emptyMessage = "記事がありません。キーワードで検索するか、新規記事を作成してください。",
  emptyActionLabel,
  emptyActionDisabled = false,
  onEmptyAction,
  categoryFilter,
  onCategoryFilterChange,
}: ArticleListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = articles.length < total && total > 0;

  /**
   * 無限スクロール用 IntersectionObserver コールバック
   *
   * - 監視対象要素（一覧の一番下）が viewport 内に入ったタイミングで onLoadMore を呼ぶ
   * - まだ読み込めるデータがある（hasMore）かつローディング中でない場合のみ発火
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (!entry?.isIntersecting || !hasMore || isLoading) return;
      onLoadMore();
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    // hasMore が false のときやローディング中は監視を行わない
    if (!hasMore || isLoading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver, hasMore, isLoading]);

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="mb-2 flex items-center justify-between shrink-0 text-sm text-slate-500">
        <p>{total > 0 ? `${articles.length} / ${total} 件` : "0 件"}</p>
        <div className="flex items-center gap-3">
          {onCategoryFilterChange && (
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-[60vw] lg:max-w-lg">
              <button
                type="button"
                onClick={() => onCategoryFilterChange("")}
                className={`rounded-full px-3 py-1 text-xs border ${
                  !categoryFilter
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                すべて
              </button>
              {DEFAULT_CATEGORY_OPTIONS.map((opt) => {
                const active = categoryFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onCategoryFilterChange(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs border ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && articles.length === 0 ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
            <p className="px-6">{emptyMessage}</p>
            {emptyActionLabel && onEmptyAction && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={onEmptyAction}
                  disabled={emptyActionDisabled}
                >
                  {emptyActionLabel}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={article.id === selectedArticleId}
                onClick={() => onArticleClick(article)}
              />
            ))}
            {isLoading && articles.length > 0 && (
              <div className="flex justify-center py-4">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            )}
            <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
