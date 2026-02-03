'use client';

/**
 * カテゴリに関する共通定義
 *
 * - サンプル CSV・初期データ生成と整合する既定カテゴリ一覧
 * - UI 側（フォームなど）で同じ定義を再利用できるようにする
 */

export type CategoryOption = { value: string; label: string };

// サンプルデータ / CSV に合わせた既定カテゴリ
export const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'Backend', label: 'Backend' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Infrastructure', label: 'Infrastructure' },
  { value: 'ML', label: 'ML' },
  { value: 'DB', label: 'DB' },
  { value: 'DevOps', label: 'DevOps' },
];

/**
 * 既存の記事に CSV 由来ではないカテゴリが設定されている場合でも、
 * セレクトボックスにその値を含めて選択状態を維持できるようにする。
 *
 * @param currentValue 現在選択されているカテゴリ値
 */
export function getCategoryOptions(currentValue: string | null): CategoryOption[] {
  if (!currentValue || DEFAULT_CATEGORY_OPTIONS.some((o) => o.value === currentValue)) {
    return DEFAULT_CATEGORY_OPTIONS;
  }
  // 既定に無いカテゴリは先頭に追加して選択状態を維持する
  return [{ value: currentValue, label: currentValue }, ...DEFAULT_CATEGORY_OPTIONS];
}

