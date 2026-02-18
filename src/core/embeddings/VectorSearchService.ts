import { horizonDB } from "@core/database/horizonDB";
import { EmbeddingService } from "@core/embeddings/EmbeddingService";
import type { EmbeddingSearchResult, EmbeddingSourceType } from "@domain/entities/Embedding";
import { createId } from "@core/utils/uuid";

export interface VectorSearchOptions {
  sourceTypes?: EmbeddingSourceType[];
  limit?: number;
  threshold?: number;
}

export interface IndexDocumentInput {
  sourceType: EmbeddingSourceType;
  sourceId: string;
  content: string;
}

export const VectorSearchService = {
  async indexDocument(input: IndexDocumentInput): Promise<string> {
    const existing = await horizonDB.embeddings
      .where("[sourceType+sourceId]")
      .equals([input.sourceType, input.sourceId])
      .first();

    if (existing) {
      const vector = await EmbeddingService.generateEmbedding(input.content);
      await horizonDB.embeddings.update(existing.id, {
        vector,
        createdAt: Date.now()
      });
      return existing.id;
    }

    const vector = await EmbeddingService.generateEmbedding(input.content);
    const id = createId();

    await horizonDB.embeddings.add({
      id,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      vector,
      dimensions: EmbeddingService.getDimensions(),
      model: "all-MiniLM-L6-v2",
      createdAt: Date.now()
    });

    return id;
  },

  async removeIndex(sourceType: EmbeddingSourceType, sourceId: string): Promise<void> {
    await horizonDB.embeddings
      .where("[sourceType+sourceId]")
      .equals([sourceType, sourceId])
      .delete();
  },

  async search(query: string, options: VectorSearchOptions = {}): Promise<EmbeddingSearchResult[]> {
    const { sourceTypes, limit = 10, threshold = 0.5 } = options;

    const queryVector = await EmbeddingService.generateEmbedding(query);
    
    let embeddings = await horizonDB.embeddings.toArray();
    
    if (sourceTypes && sourceTypes.length > 0) {
      embeddings = embeddings.filter(e => sourceTypes.includes(e.sourceType));
    }

    const results: EmbeddingSearchResult[] = [];
    
    for (const embedding of embeddings) {
      const similarity = EmbeddingService.cosineSimilarity(queryVector, embedding.vector);
      
      if (similarity >= threshold) {
        results.push({
          id: embedding.id,
          sourceType: embedding.sourceType,
          sourceId: embedding.sourceId,
          similarity
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  },

  async searchWithContent(
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<(EmbeddingSearchResult & { content?: string; title?: string })[]> {
    const results = await this.search(query, options);
    
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        let content: string | undefined;
        let title: string | undefined;

        switch (result.sourceType) {
          case "note": {
            const note = await horizonDB.notes.get(result.sourceId);
            if (note) {
              content = note.content;
              title = note.title;
            }
            break;
          }
          case "document": {
            const doc = await horizonDB.documents.get(result.sourceId);
            if (doc) {
              content = doc.content.slice(0, 500);
              title = doc.filename;
            }
            break;
          }
          case "lesson": {
            const lesson = await horizonDB.lessons.get(result.sourceId);
            if (lesson) {
              content = lesson.content;
              title = lesson.title;
            }
            break;
          }
          case "card": {
            const card = await horizonDB.cards.get(result.sourceId);
            if (card) {
              content = card.content;
            }
            break;
          }
          case "task": {
            const task = await horizonDB.tasks.get(result.sourceId);
            if (task) {
              content = task.description;
              title = task.title;
            }
            break;
          }
        }

        return { ...result, content, title };
      })
    );

    return enrichedResults;
  },

  async getSimilarDocuments(
    sourceType: EmbeddingSourceType,
    sourceId: string,
    limit: number = 5
  ): Promise<EmbeddingSearchResult[]> {
    const embedding = await horizonDB.embeddings
      .where("[sourceType+sourceId]")
      .equals([sourceType, sourceId])
      .first();

    if (!embedding) {
      return [];
    }

    const allEmbeddings = await horizonDB.embeddings.toArray();
    const results: EmbeddingSearchResult[] = [];

    for (const other of allEmbeddings) {
      if (other.sourceType === sourceType && other.sourceId === sourceId) {
        continue;
      }

      const similarity = EmbeddingService.cosineSimilarity(embedding.vector, other.vector);
      
      results.push({
        id: other.id,
        sourceType: other.sourceType,
        sourceId: other.sourceId,
        similarity
      });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  },

  async getStats(): Promise<{
    totalEmbeddings: number;
    byType: Record<EmbeddingSourceType, number>;
    dimensions: number;
  }> {
    const embeddings = await horizonDB.embeddings.toArray();
    
    const byType: Record<string, number> = {};
    for (const embedding of embeddings) {
      byType[embedding.sourceType] = (byType[embedding.sourceType] || 0) + 1;
    }

    return {
      totalEmbeddings: embeddings.length,
      byType: byType as Record<EmbeddingSourceType, number>,
      dimensions: EmbeddingService.getDimensions()
    };
  }
};