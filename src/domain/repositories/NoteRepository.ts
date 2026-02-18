import type { Note } from "@domain/entities/Note";

export interface NoteRepository {
  getById(id: string): Promise<Note | null>;
  getAll(): Promise<Note[]>;
  getByParentId(parentId: string | null): Promise<Note[]>;
  getByTags(tags: string[]): Promise<Note[]>;
  search(query: string): Promise<Note[]>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
}