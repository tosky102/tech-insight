"use client";

/**
 * ソートに関する共通定義
 *
 * - 記事一覧の並び順（更新日新しい順 / 古い順）を UI と API で共有
 * - セレクトボックスなどのオプション一覧を一元管理
 */

/** 並び順の値（API の sort クエリと一致） */
export type SortOption = "newest" | "oldest";

/** ソート選択肢（value: API 送信値, label: 表示ラベル） */
export type SortOptionItem = { value: SortOption; label: string };

/** ソート用の選択肢一覧（セレクトなどで利用） */
export const SORT_OPTIONS: SortOptionItem[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];
