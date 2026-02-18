import type { Embedding, EmbeddingSearchResult } from "@domain/entities/Embedding";

export interface EmbeddingRepository {
  getById(id: string): Promise<Embedding | null>;
  getBySource(sourceType: string, sourceId: string): Promise<Embedding | null>;
  save(embedding: Embedding): Promise<void>;
  delete(id: string): Promise<void>;
  deleteBySource(sourceType: string, sourceId: string): Promise<void>;
  search(vector: number[], limit?: number): Promise<EmbeddingSearchResult[]>;
}