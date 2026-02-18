import type { FlashcardRepository } from "@domain/repositories/FlashcardRepository";
import type { Flashcard, FlashcardReviewResult } from "@domain/entities/Flashcard";
import { horizonDB } from "@core/database/horizonDB";

const SM2_PARAMS = {
  minEaseFactor: 1.3,
  defaultEaseFactor: 2.5,
  intervals: {
    again: 1,
    hard: 1,
    good: 3,
    easy: 5
  },
  easeModifiers: {
    again: -0.2,
    hard: -0.15,
    good: 0,
    easy: 0.15
  }
};

export class FlashcardRepositoryImpl implements FlashcardRepository {
  async getById(id: string): Promise<Flashcard | null> {
    const card = await horizonDB.flashcards.get(id);
    return card || null;
  }

  async getByLessonId(lessonId: string): Promise<Flashcard[]> {
    return horizonDB.flashcards.where("lessonId").equals(lessonId).toArray();
  }

  async getDueCards(limit: number = 20): Promise<Flashcard[]> {
    const now = Date.now();
    const cards = await horizonDB.flashcards
      .where("nextReview")
      .belowOrEqual(now)
      .limit(limit)
      .toArray();

    return cards;
  }

  async getAll(): Promise<Flashcard[]> {
    return horizonDB.flashcards.toArray();
  }

  async save(flashcard: Flashcard): Promise<void> {
    await horizonDB.flashcards.put({ ...flashcard, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.flashcards.delete(id);
  }

  async recordReview(id: string, result: FlashcardReviewResult): Promise<void> {
    const card = await horizonDB.flashcards.get(id);
    if (!card) return;

    const { rating } = result;
    const { interval, easeFactor, reps, lapses } = this.calculateSM2(card, rating);

    await horizonDB.flashcards.update(id, {
      interval,
      easeFactor,
      reps,
      lapses,
      nextReview: Date.now() + interval * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    });
  }

  private calculateSM2(
    card: Flashcard,
    rating: FlashcardReviewResult["rating"]
  ): { interval: number; easeFactor: number; reps: number; lapses: number } {
    let { interval, easeFactor, reps, lapses } = card;

    if (rating === "again") {
      interval = SM2_PARAMS.intervals.again;
      reps = 0;
      lapses = lapses + 1;
    } else {
      reps = reps + 1;
      
      if (reps === 1) {
        interval = SM2_PARAMS.intervals[rating];
      } else if (reps === 2) {
        interval = SM2_PARAMS.intervals[rating] * 2;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    easeFactor = Math.max(
      SM2_PARAMS.minEaseFactor,
      easeFactor + SM2_PARAMS.easeModifiers[rating]
    );

    return { interval, easeFactor, reps, lapses };
  }
}