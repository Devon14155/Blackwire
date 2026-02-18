import type { Document } from "@domain/entities/Document";

export interface DocumentRepository {
  getById(id: string): Promise<Document | null>;
  getAll(): Promise<Document[]>;
  getByTags(tags: string[]): Promise<Document[]>;
  search(query: string): Promise<Document[]>;
  save(document: Document): Promise<void>;
  delete(id: string): Promise<void>;
}