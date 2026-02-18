import type { EmbeddingRepository } from "@domain/repositories/EmbeddingRepository";
import type { Embedding, EmbeddingSearchResult } from "@domain/entities/Embedding";
import { horizonDB } from "@core/database/horizonDB";
import { EmbeddingService } from "@core/embeddings/EmbeddingService";

export class EmbeddingRepositoryImpl implements EmbeddingRepository {
  async getById(id: string): Promise<Embedding | null> {
    const embedding = await horizonDB.embeddings.get(id);
    return embedding || null;
  }

  async getBySource(sourceType: string, sourceId: string): Promise<Embedding | null> {
    const embeddings = await horizonDB.embeddings
      .where("[sourceType+sourceId]")
      .equals([sourceType, sourceId])
      .toArray();
    
    return embeddings[0] || null;
  }

  async save(embedding: Embedding): Promise<void> {
    await horizonDB.embeddings.put(embedding);
  }

  async delete(id: string): Promise<void> {
    await horizonDB.embeddings.delete(id);
  }

  async deleteBySource(sourceType: string, sourceId: string): Promise<void> {
    await horizonDB.embeddings
      .where("[sourceType+sourceId]")
      .equals([sourceType, sourceId])
      .delete();
  }

  async search(vector: number[], limit: number = 10): Promise<EmbeddingSearchResult[]> {
    const allEmbeddings = await horizonDB.embeddings.toArray();
    
    const results: EmbeddingSearchResult[] = [];

    for (const embedding of allEmbeddings) {
      const similarity = EmbeddingService.cosineSimilarity(vector, embedding.vector);
      
      results.push({
        id: embedding.id,
        sourceType: embedding.sourceType,
        sourceId: embedding.sourceId,
        similarity
      });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  }
}