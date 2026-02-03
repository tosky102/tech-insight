'use client';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-600">
            © {year} TechInsight - AI搭載型ナレッジベース
          </p>
          <nav className="flex gap-6 text-sm text-slate-600">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600"
            >
              API ドキュメント
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
