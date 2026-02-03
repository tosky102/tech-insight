'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// 検索モード
// - keyword: タイトル・本文などの LIKE 検索
// - semantic: ベクトル類似度を使った AI 検索
export type SearchMode = 'keyword' | 'semantic';

export interface SearchBarProps {
  onKeywordSearch: (keyword: string) => void;
  onSemanticSearch: (query: string) => void;
  searchMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  isLoading?: boolean;
}

export function SearchBar({
  onKeywordSearch,
  onSemanticSearch,
  searchMode,
  onModeChange,
  isLoading = false,
}: SearchBarProps) {
  const [value, setValue] = useState('');

  /**
   * 検索フォーム送信時の処理
   *
   * - semantic モード: 入力必須。自然言語クエリで AI 検索を実行
   * - keyword モード: 空文字なら「全件表示」として扱う
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = value.trim();
      if (searchMode === 'semantic') {
        if (!q) return;
        onSemanticSearch(q);
      } else {
        // キーワードモード: 空の場合は全件表示させる
        onKeywordSearch(q);
      }
    },
    [value, searchMode, onKeywordSearch, onSemanticSearch]
  );

  /**
   * 入力欄右側の × クリアボタン押下時
   *
   * - 入力値を空にする
   * - キーワードモードのときは全件表示に戻す
   * - AI 検索モードでは単に入力をクリアする（一覧は直前の結果のまま）
   */
  const handleClear = useCallback(() => {
    setValue('');
    if (searchMode === 'keyword') {
      onKeywordSearch('');
    }
  }, [searchMode, onKeywordSearch]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {searchMode === 'semantic' ? 'セマンティック検索（自然言語）' : 'キーワード検索'}
        </label>
        <div className="relative">
          <Input
            placeholder={
              searchMode === 'semantic'
                ? '例: 認証の実装方法を教えて'
                : 'タイトル・本文・カテゴリ・著者で検索'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
            className="pr-9"
          />
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="キーワードを削除"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => onModeChange('keyword')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              searchMode === 'keyword' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            キーワード
          </button>
          <button
            type="button"
            onClick={() => onModeChange('semantic')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              searchMode === 'semantic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI検索
          </button>
        </div>
        <Button
          type="submit"
          disabled={(searchMode === 'semantic' && !value.trim()) || isLoading}
        >
          検索
        </Button>
      </div>
    </form>
  );
}
