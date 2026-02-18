import type { Flashcard, FlashcardReviewResult } from "@domain/entities/Flashcard";

export interface FlashcardRepository {
  getById(id: string): Promise<Flashcard | null>;
  getByLessonId(lessonId: string): Promise<Flashcard[]>;
  getDueCards(limit?: number): Promise<Flashcard[]>;
  getAll(): Promise<Flashcard[]>;
  save(flashcard: Flashcard): Promise<void>;
  delete(id: string): Promise<void>;
  recordReview(id: string, result: FlashcardReviewResult): Promise<void>;
}