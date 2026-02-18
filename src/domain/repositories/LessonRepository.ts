import type { Lesson } from "@domain/entities/Lesson";

export interface LessonRepository {
  getById(id: string): Promise<Lesson | null>;
  getByVaultId(vaultId: string): Promise<Lesson[]>;
  getNextLesson(vaultId: string, currentOrder: number): Promise<Lesson | null>;
  save(lesson: Lesson): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByVaultId(vaultId: string): Promise<void>;
}