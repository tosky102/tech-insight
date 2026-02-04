"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";

interface SearchSummary {
  total_searches: number;
  zero_result_searches: number;
  zero_result_rate: number;
  keyword_searches: number;
  semantic_searches: number;
}

interface PopularArticle {
  article_id: number;
  title: string;
  click_count: number;
  last_clicked_at: string;
}

export function MetricsDashboard() {
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [popular, setPopular] = useState<PopularArticle[]>([]);
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMetrics() {
      setIsLoading(true);
      setError(null);
      try {
        const [s, p] = await Promise.all([
          apiGetSearchSummary(days),
          apiGetPopularArticles(10, 30),
        ]);
        if (cancelled) return;
        setSummary(s);
        setPopular(p);
      } catch (e: any) {
        if (cancelled) return;
        console.error(e);
        setError(e?.message ?? "メトリクスの取得に失敗しました。");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const zeroRatePercent =
    summary && summary.total_searches > 0
      ? Math.round(summary.zero_result_rate * 1000) / 10
      : 0;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          検索メトリクスダッシュボード
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>集計期間:</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            <option value={7}>直近7日</option>
            <option value={30}>直近30日</option>
            <option value={90}>直近90日</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="検索回数（合計）"
          value={summary ? summary.total_searches.toLocaleString() : "-"}
          isLoading={isLoading && !summary}
        />
        <MetricCard
          label="0件検索回数"
          value={summary ? summary.zero_result_searches.toLocaleString() : "-"}
          isLoading={isLoading && !summary}
        />
        <MetricCard
          label="0件率"
          value={summary ? `${zeroRatePercent.toFixed(1)}%` : "-"}
          isLoading={isLoading && !summary}
        />
        <MetricCard
          label="AI検索比率"
          value={
            summary && summary.total_searches > 0
              ? `${
                  Math.round(
                    (summary.semantic_searches / summary.total_searches) * 1000
                  ) / 10
                }%`
              : "-"
          }
          isLoading={isLoading && !summary}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            検索モード別 回数
          </h3>
          {summary ? (
            <table className="w-full text-sm text-slate-700">
              <tbody>
                <tr>
                  <td className="py-1 pr-4 text-slate-500">キーワード検索</td>
                  <td className="py-1 text-right">
                    {summary.keyword_searches.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 text-slate-500">AI検索</td>
                  <td className="py-1 text-right">
                    {summary.semantic_searches.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-slate-500">
              {isLoading ? "読み込み中..." : "データがまだありません。"}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            人気記事（クリック数順 上位10件）
          </h3>
          {popular.length === 0 ? (
            <div className="text-sm text-slate-500">
              {isLoading ? "読み込み中..." : "まだクリックデータがありません。"}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-1 pr-2 text-left font-normal">
                      タイトル
                    </th>
                    <th className="py-1 px-2 text-right font-normal">
                      クリック数
                    </th>
                    <th className="py-1 pl-2 text-right font-normal">
                      最終クリック
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {popular.map((p) => (
                    <tr
                      key={p.article_id}
                      className="border-b border-slate-100"
                    >
                      <td className="py-1 pr-2">
                        <span className="line-clamp-2">{p.title}</span>
                      </td>
                      <td className="py-1 px-2 text-right">
                        {p.click_count.toLocaleString()}
                      </td>
                      <td className="py-1 pl-2 text-right text-xs text-slate-500">
                        {new Date(p.last_clicked_at).toLocaleString("ja-JP", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard(props: {
  label: string;
  value: string;
  isLoading?: boolean;
}) {
  const { label, value, isLoading } = props;
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">
        {isLoading ? (
          <span className="inline-block h-5 w-16 animate-pulse rounded bg-slate-200" />
        ) : (
          value
        )}
      </div>
    </Card>
  );
}

async function apiGetSearchSummary(days: number): Promise<SearchSummary> {
  const sp = new URLSearchParams({ days: String(days) });
  return fetchJson<SearchSummary>(`/metrics/search/summary?${sp}`);
}

async function apiGetPopularArticles(
  limit: number,
  days: number
): Promise<PopularArticle[]> {
  const sp = new URLSearchParams({
    limit: String(limit),
    days: String(days),
  });
  const res = await fetchJson<{ items: PopularArticle[] }>(
    `/metrics/articles/popular?${sp}`
  );
  return res.items;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(
    path.startsWith("http")
      ? path
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
