export interface Flashcard {
  id: string;
  lessonId: string | null;
  front: string;
  back: string;
  nextReview: number;
  interval: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  createdAt: number;
  updatedAt: number;
}

export interface FlashcardSnapshot extends Flashcard {}

export interface FlashcardReviewResult {
  rating: "again" | "hard" | "good" | "easy";
  reviewedAt: number;
}