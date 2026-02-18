import type { DocumentRepository } from "@domain/repositories/DocumentRepository";
import type { Document } from "@domain/entities/Document";
import { horizonDB } from "@core/database/horizonDB";

export class DocumentRepositoryImpl implements DocumentRepository {
  async getById(id: string): Promise<Document | null> {
    const doc = await horizonDB.documents.get(id);
    return doc || null;
  }

  async getAll(): Promise<Document[]> {
    return horizonDB.documents.toArray();
  }

  async getByTags(tags: string[]): Promise<Document[]> {
    const allDocs = await horizonDB.documents.toArray();
    return allDocs.filter(doc =>
      tags.some(tag => doc.tags.includes(tag))
    );
  }

  async search(query: string): Promise<Document[]> {
    const lowerQuery = query.toLowerCase();
    const allDocs = await horizonDB.documents.toArray();
    
    return allDocs.filter(doc =>
      doc.filename.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async save(document: Document): Promise<void> {
    await horizonDB.documents.put({ ...document, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.documents.delete(id);
  }
}