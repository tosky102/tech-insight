import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'TechInsight - AIナレッジベース',
  description: '技術記事のナレッジマネジメント',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col antialiased font-sans">
        {children}
        <Footer />
      </body>
    </html>
  );
}
