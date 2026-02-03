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
      <aside className="flex h-full min-h-0 w-full flex-col border-slate-200 bg-slate-50/50 lg:min-h-[400px] lg:h-auto lg:w-[420px] lg:min-w-[360px] lg:border-l">
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

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-slate-200 bg-white  lg:min-h-[400px] lg:w-[420px] lg:min-w-[360px] lg:border-l lg:max-h-[calc(100vh-200px)]">
      <div className="sticky top-0 flex flex-col border-b border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {article.title}
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
        <div className="mt-3 flex flex-wrap gap-2 justify-end">
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
