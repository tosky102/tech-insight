"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-full items-center justify-between px-4 sm:px-6 md:max-w-[1040px] lg:max-w-[1600px] lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold text-slate-900 hover:text-slate-700"
        >
          TechInsight
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link
            href="/"
            className={
              pathname === "/"
                ? "font-medium text-brand-600"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            記事一覧
          </Link>
          <Link
            href="/admin"
            className={
              pathname?.startsWith("/admin")
                ? "font-medium text-brand-600"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            管理画面
          </Link>
        </nav>
      </div>
    </header>
  );
}
