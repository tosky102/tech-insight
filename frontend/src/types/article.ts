export interface Article {
  id: number;
  title: string;
  content: string;
  category: string | null;
  author: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  page_size: number;
}

export interface ArticleCreateInput {
  title: string;
  content: string;
  category?: string | null;
  author?: string | null;
}

export interface ArticleUpdateInput {
  title?: string;
  content?: string;
  category?: string | null;
  author?: string | null;
}
