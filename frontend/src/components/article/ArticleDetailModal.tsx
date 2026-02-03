"use client";

import type { Article } from "@/types/article";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface ArticleDetailModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  isDeleting?: boolean;
}

export function ArticleDetailModal({
  article,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: ArticleDetailModalProps) {
  if (!article) return null;

  const date = new Date(article.updated_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={article.title}
      maxWidth="xl"
      children={
        <div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-500">
            {article.category && (
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {article.category}
              </span>
            )}
            {article.author && <span>著者: {article.author}</span>}
            <span>更新: {date}</span>
          </div>
          <div className="prose max-w-none border-t border-slate-200 pt-4">
            <div className="whitespace-pre-wrap text-slate-700">
              {article.content}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            {onEdit && (
              <Button variant="secondary" onClick={() => onEdit(article)}>
                編集
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger"
                onClick={() => onDelete(article)}
                isLoading={isDeleting}
              >
                削除
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      }
    />
  );
}
