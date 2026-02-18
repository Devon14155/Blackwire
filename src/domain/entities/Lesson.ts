export type LessonStatus = "pending" | "in_progress" | "completed" | "reviewing";

export interface Lesson {
  id: string;
  vaultId: string;
  title: string;
  content: string;
  summary: string;
  order: number;
  status: LessonStatus;
  duration: number;
  createdAt: number;
  updatedAt: number;
  embeddingId: string | null;
}

export interface LessonSnapshot extends Lesson {}