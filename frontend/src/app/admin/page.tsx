"use client";

import { useState } from "react";
import { ArticlePageContainer } from "@/components/article/ArticlePageContainer";
import { MetricsDashboard } from "@/components/admin/MetricsDashboard";

type AdminTab = "articles" | "metrics";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("articles");

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-full px-4 pt-4 sm:px-6 md:max-w-[1040px] lg:max-w-[1600px] lg:px-8">
        <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("articles")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "articles"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            記事管理
          </button>
          <button
            type="button"
            onClick={() => setTab("metrics")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "metrics"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            メトリクス
          </button>
        </div>
      </div>

      {tab === "articles" ? (
        <ArticlePageContainer allowCrud title="管理画面" />
      ) : (
        <section className="mx-auto flex h-full w-full max-w-full flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-6 md:max-w-[1040px] lg:max-w-[1600px] lg:px-8">
          <MetricsDashboard />
        </section>
      )}
    </main>
  );
}
