import { VectorSearchService } from "@core/embeddings/VectorSearchService";
import type { EmbeddingSearchResult, EmbeddingSourceType } from "@domain/entities/Embedding";
import { horizonDB } from "@core/database/horizonDB";

export interface RAGContext {
  sources: RAGSource[];
  formattedContext: string;
  totalTokens: number;
}

export interface RAGSource {
  id: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  title?: string;
  snippet: string;
  relevance: number;
}

export interface RAGOptions {
  sourceTypes?: EmbeddingSourceType[];
  maxSources?: number;
  maxTokens?: number;
  minRelevance?: number;
}

const ESTIMATED_CHARS_PER_TOKEN = 4;

export const RAGService = {
  async retrieveContext(query: string, options: RAGOptions = {}): Promise<RAGContext> {
    const {
      sourceTypes,
      maxSources = 5,
      maxTokens = 2000,
      minRelevance = 0.5
    } = options;

    const searchResults = await VectorSearchService.searchWithContent(query, {
      sourceTypes,
      limit: maxSources,
      threshold: minRelevance
    });

    const sources: RAGSource[] = [];
    let totalTokens = 0;
    const contextParts: string[] = [];

    for (const result of searchResults) {
      const snippet = this.createSnippet(result.content, maxTokens - totalTokens);
      const estimatedTokens = Math.ceil(snippet.length / ESTIMATED_CHARS_PER_TOKEN);

      if (totalTokens + estimatedTokens > maxTokens) {
        break;
      }

      const source: RAGSource = {
        id: result.id,
        sourceType: result.sourceType,
        sourceId: result.sourceId,
        title: result.title,
        snippet,
        relevance: result.similarity
      };

      sources.push(source);
      totalTokens += estimatedTokens;

      const sourceLabel = this.formatSourceLabel(source);
      contextParts.push(`[${sourceLabel}]\n${snippet}`);
    }

    const formattedContext = contextParts.length > 0
      ? `--- Retrieved Context ---\n${contextParts.join("\n\n")}\n--- End Context ---`
      : "";

    return {
      sources,
      formattedContext,
      totalTokens
    };
  },

  createSnippet(content?: string, maxChars: number = 1000): string {
    if (!content) {
      return "";
    }

    const truncated = content.slice(0, maxChars);
    const sentences = truncated.split(/[.!?]+/);
    
    if (sentences.length > 1) {
      sentences.pop();
      return sentences.join(". ") + ".";
    }

    return truncated + (content.length > maxChars ? "..." : "");
  },

  formatSourceLabel(source: RAGSource): string {
    const typeLabels: Record<EmbeddingSourceType, string> = {
      note: "Note",
      document: "Document",
      lesson: "Lesson",
      card: "Card",
      message: "Message",
      task: "Task"
    };

    const typeLabel = typeLabels[source.sourceType] || source.sourceType;
    const title = source.title ? `: ${source.title}` : "";
    const relevance = Math.round(source.relevance * 100);

    return `${typeLabel}${title} (relevance: ${relevance}%)`;
  },

  formatContextForPrompt(context: RAGContext): string {
    if (!context.formattedContext) {
      return "";
    }

    return `\n${context.formattedContext}\n\nUse the above context to inform your response. Cite sources when appropriate.`;
  },

  async enrichConversation(
    query: string,
    options: RAGOptions = {}
  ): Promise<{ context: RAGContext; citations: CitationInfo[] }> {
    const context = await this.retrieveContext(query, options);
    const citations = await this.buildCitations(context.sources);

    return { context, citations };
  },

  async buildCitations(sources: RAGSource[]): Promise<CitationInfo[]> {
    return sources.map((source, index) => ({
      id: `cite-${index}`,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      title: source.title,
      snippet: source.snippet,
      relevance: source.relevance
    }));
  },

  async indexNote(noteId: string): Promise<void> {
    const note = await horizonDB.notes.get(noteId);
    if (!note) return;

    const embeddingId = await VectorSearchService.indexDocument({
      sourceType: "note",
      sourceId: noteId,
      content: `${note.title}\n${note.content}`
    });

    await horizonDB.notes.update(noteId, { embeddingId });
  },

  async indexDocument(documentId: string): Promise<void> {
    const doc = await horizonDB.documents.get(documentId);
    if (!doc) return;

    const embeddingId = await VectorSearchService.indexDocument({
      sourceType: "document",
      sourceId: documentId,
      content: `${doc.filename}\n${doc.content}`
    });

    await horizonDB.documents.update(documentId, { embeddingId });
  },

  async indexLesson(lessonId: string): Promise<void> {
    const lesson = await horizonDB.lessons.get(lessonId);
    if (!lesson) return;

    const embeddingId = await VectorSearchService.indexDocument({
      sourceType: "lesson",
      sourceId: lessonId,
      content: `${lesson.title}\n${lesson.content}`
    });

    await horizonDB.lessons.update(lessonId, { embeddingId });
  },

  async indexCard(cardId: string): Promise<void> {
    const card = await horizonDB.cards.get(cardId);
    if (!card) return;

    const embeddingId = await VectorSearchService.indexDocument({
      sourceType: "card",
      sourceId: cardId,
      content: card.content
    });

    await horizonDB.cards.update(cardId, { embeddingId });
  },

  async indexTask(taskId: string): Promise<void> {
    const task = await horizonDB.tasks.get(taskId);
    if (!task) return;

    const embeddingId = await VectorSearchService.indexDocument({
      sourceType: "task",
      sourceId: taskId,
      content: `${task.title}\n${task.description}`
    });

    await horizonDB.tasks.update(taskId, { embeddingId });
  }
};

export interface CitationInfo {
  id: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  title?: string;
  snippet: string;
  relevance: number;
}