import { ArticlePageContainer } from '@/components/article/ArticlePageContainer';

export default function Home() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <ArticlePageContainer allowCrud={false} />
    </main>
  );
}
