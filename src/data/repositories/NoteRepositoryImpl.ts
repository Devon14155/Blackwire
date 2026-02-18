import type { NoteRepository } from "@domain/repositories/NoteRepository";
import type { Note } from "@domain/entities/Note";
import { horizonDB } from "@core/database/horizonDB";

export class NoteRepositoryImpl implements NoteRepository {
  async getById(id: string): Promise<Note | null> {
    const note = await horizonDB.notes.get(id);
    return note || null;
  }

  async getAll(): Promise<Note[]> {
    return horizonDB.notes.toArray();
  }

  async getByParentId(parentId: string | null): Promise<Note[]> {
    if (parentId === null) {
      return horizonDB.notes.where("parentId").equals(null as unknown as string).toArray();
    }
    return horizonDB.notes.where("parentId").equals(parentId).toArray();
  }

  async getByTags(tags: string[]): Promise<Note[]> {
    const allNotes = await horizonDB.notes.toArray();
    return allNotes.filter(note =>
      tags.some(tag => note.tags.includes(tag))
    );
  }

  async search(query: string): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    const allNotes = await horizonDB.notes.toArray();
    
    return allNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async save(note: Note): Promise<void> {
    await horizonDB.notes.put({ ...note, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.notes.delete(id);
  }
}