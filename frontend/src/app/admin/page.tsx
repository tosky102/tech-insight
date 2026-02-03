import { ArticlePageContainer } from '@/components/article/ArticlePageContainer';

export default function AdminPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <ArticlePageContainer allowCrud title="管理画面" />
    </main>
  );
}
