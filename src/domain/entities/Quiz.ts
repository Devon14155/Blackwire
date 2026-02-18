export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "fill_blank";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: number | null;
  createdAt: number;
}

export interface QuizSnapshot extends Quiz {}