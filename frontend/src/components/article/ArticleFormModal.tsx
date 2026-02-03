'use client';

/**
 * 記事の新規作成・編集用モーダルフォーム
 *
 * - mode によって「作成」と「編集」を切り替える
 * - バリデーションはタイトル・本文必須のみシンプルに実装
 * - カテゴリはプルダウン（既定カテゴリ + 既存値）で選択
 */
import { useState, useEffect } from 'react';
import type { Article, ArticleCreateInput, ArticleUpdateInput } from '@/types/article';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getCategoryOptions } from '@/constants/categories';

export type ArticleFormMode = 'create' | 'edit';

export interface ArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ArticleFormMode;
  initialData?: Article | null;
  onSubmit: (data: ArticleCreateInput | ArticleUpdateInput) => Promise<void>;
  isLoading?: boolean;
}

const emptyForm: ArticleCreateInput = {
  title: '',
  content: '',
  category: null,
  author: null,
};

export function ArticleFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  isLoading = false,
}: ArticleFormModalProps) {
  const [form, setForm] = useState<ArticleCreateInput>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ArticleCreateInput, string>>>({});

  // モーダルの開閉・モード・初期データに応じてフォーム内容を初期化
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        title: initialData.title,
        content: initialData.content,
        category: initialData.category ?? null,
        author: initialData.author ?? null,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [mode, initialData, isOpen]);

  /**
   * 最小限のバリデーション
   * - タイトル必須
   * - 本文必須
   */
  const validate = (): boolean => {
    const next: Partial<Record<keyof ArticleCreateInput, string>> = {};
    if (!form.title.trim()) next.title = 'タイトルを入力してください';
    if (!form.content.trim()) next.content = '本文を入力してください';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? '新規記事' : '記事を編集'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="タイトル"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          error={errors.title}
          required
        />
        <Textarea
          label="本文"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          error={errors.content}
          rows={8}
          required
        />
        <Select
          label="カテゴリ"
          options={getCategoryOptions(form.category ?? null)}
          placeholder="未選択"
          value={form.category ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value || null }))}
        />
        <Input
          label="著者"
          value={form.author ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, author: e.target.value || null }))}
        />
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {mode === 'create' ? '作成' : '更新'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
