"use client";

/**
 * 記事詳細パネル（画面右側）
 *
 * - 左の一覧で選択された記事の詳細を表示する
 * - ヘッダー部分を sticky にして、スクロールしてもタイトル・操作ボタンが常に見えるようにする
 */
import type { Article } from "@/types/article";
import { Button } from "@/components/ui/Button";

export interface ArticleDetailPanelProps {
  article: Article | null;
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  isDeleting?: boolean;
}

export function ArticleDetailPanel({
  article,
  onEdit,
  onDelete,
  isDeleting = false,
}: ArticleDetailPanelProps) {
  // 記事が選択されていない場合のプレースホルダー表示
  if (!article) {
    return (
      <aside className="flex h-full min-h-0 w-full flex-col border-slate-200 bg-slate-50/50 lg:min-h-[400px] lg:w-[420px] lg:min-w-[360px] lg:border-l">
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center p-8 text-center text-slate-500 lg:min-h-0">
          <p className="text-sm">記事を選択するとここに詳細が表示されます。</p>
        </div>
      </aside>
    );
  }

  const dateTime = new Date(article.updated_at).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sharePath = `/?article=${article.id}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (e) {
      console.error("failed to copy link", e);
    }
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-slate-200 bg-white  lg:min-h-[400px] lg:w-[420px] lg:min-w-[360px] lg:border-l lg:max-h-[calc(100vh-200px)]">
      <div className="sticky top-0 flex flex-col border-b border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          <a href={sharePath} className="hover:underline">
            {article.title}
          </a>
        </h2>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            {article.category && (
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {article.category}
              </span>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {article.author && <span>著者: {article.author}</span>}
            <span>更新: {dateTime}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 max-w-[60%]">
            <span className="shrink-0">共有URL:</span>
            <a
              href={sharePath}
              className="truncate text-brand-600 hover:underline"
            >
              {shareUrl}
            </a>
          </div>
          {onEdit && (
            <Button
              variant="secondary"
              className="py-1.5 text-sm"
              onClick={() => onEdit(article)}
            >
              編集
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              className="py-1.5 text-sm"
              onClick={() => onDelete(article)}
              isLoading={isDeleting}
            >
              削除
            </Button>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="記事リンクをコピー"
            title="記事リンクをコピー"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 17H7C5.343 17 4 15.657 4 14V7C4 5.343 5.343 4 7 4H14C15.657 4 17 5.343 17 7V8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="8"
                y="8"
                width="12"
                height="12"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="whitespace-pre-wrap text-slate-700">
          {article.content}
        </div>
      </div>
    </aside>
  );
}
