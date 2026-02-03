"use client";

/**
 * 記事一覧用のカード表示コンポーネント
 *
 * - タイトル・本文冒頭・カテゴリ・著者・更新日のサマリを表示
 * - クリック / Enter / Space で右側の詳細パネルに記事を表示する
 */
import type { Article } from "@/types/article";
import { Card } from "@/components/ui/Card";

export interface ArticleCardProps {
  article: Article;
  /** 右側の詳細パネルで表示中かどうか（背景でハイライト） */
  isSelected?: boolean;
  onClick?: () => void;
}

export function ArticleCard({
  article,
  isSelected = false,
  onClick,
}: ArticleCardProps) {
  const dateTime = new Date(article.updated_at).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      className={`cursor-pointer transition hover:shadow-md ${
        isSelected
          ? "border-2 border-brand-500 border-l-4 border-l-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-200 hover:bg-brand-100"
          : "bg-white hover:bg-slate-50"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="p-4">
        {isSelected && (
          <span className="mb-2 inline-block rounded bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
            選択中
          </span>
        )}
        <h3 className="font-semibold text-slate-900 line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
          {article.content}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            {article.category && (
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {article.category}
              </span>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {article.author && <span>{article.author}</span>}
            <span>{dateTime}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
