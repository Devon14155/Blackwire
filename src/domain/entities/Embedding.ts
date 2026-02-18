export type EmbeddingSourceType = "note" | "card" | "lesson" | "document" | "message" | "task";

export interface Embedding {
  id: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  vector: number[];
  dimensions: number;
  model: string;
  createdAt: number;
}

export interface EmbeddingSearchResult {
  id: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  similarity: number;
  snippet?: string;
}

export interface EmbeddingSnapshot extends Embedding {}