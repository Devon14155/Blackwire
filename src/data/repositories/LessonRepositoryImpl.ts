import type { LessonRepository } from "@domain/repositories/LessonRepository";
import type { Lesson } from "@domain/entities/Lesson";
import { horizonDB } from "@core/database/horizonDB";

export class LessonRepositoryImpl implements LessonRepository {
  async getById(id: string): Promise<Lesson | null> {
    const lesson = await horizonDB.lessons.get(id);
    return lesson || null;
  }

  async getByVaultId(vaultId: string): Promise<Lesson[]> {
    return horizonDB.lessons.where("vaultId").equals(vaultId).sortBy("order");
  }

  async getNextLesson(vaultId: string, currentOrder: number): Promise<Lesson | null> {
    const lessons = await horizonDB.lessons
      .where("vaultId")
      .equals(vaultId)
      .filter(l => l.order > currentOrder && l.status !== "completed")
      .sortBy("order");

    return lessons[0] || null;
  }

  async save(lesson: Lesson): Promise<void> {
    await horizonDB.lessons.put({ ...lesson, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.lessons.delete(id);
  }

  async deleteByVaultId(vaultId: string): Promise<void> {
    await horizonDB.lessons.where("vaultId").equals(vaultId).delete();
  }
}