import { create } from "zustand";
import { horizonDB } from "@core/database/horizonDB";
import type { Vault, VaultStatus } from "@domain/entities/Vault";
import type { Lesson, LessonStatus } from "@domain/entities/Lesson";
import type { Flashcard, FlashcardReviewResult } from "@domain/entities/Flashcard";
import { createId } from "@core/utils/uuid";

interface LearningState {
  vaults: Vault[];
  currentVault: Vault | null;
  lessons: Lesson[];
  currentLesson: Lesson | null;
  flashcards: Flashcard[];
  dueCards: Flashcard[];
  loading: boolean;
  error?: string;

  initialize: () => Promise<void>;
  createVault: (title: string, topic: string, description?: string) => Promise<Vault>;
  updateVault: (id: string, updates: Partial<Vault>) => Promise<void>;
  deleteVault: (id: string) => Promise<void>;
  selectVault: (id: string) => Promise<void>;

  createLesson: (vaultId: string, title: string, content: string, order?: number) => Promise<Lesson>;
  updateLesson: (id: string, updates: Partial<Lesson>) => Promise<void>;
  updateLessonStatus: (id: string, status: LessonStatus) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  selectLesson: (id: string) => Promise<void>;

  createFlashcard: (front: string, back: string, lessonId?: string) => Promise<Flashcard>;
  getDueCards: (limit?: number) => Promise<void>;
  reviewFlashcard: (id: string, result: FlashcardReviewResult) => Promise<void>;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  vaults: [],
  currentVault: null,
  lessons: [],
  currentLesson: null,
  flashcards: [],
  dueCards: [],
  loading: false,
  error: undefined,

  initialize: async () => {
    set({ loading: true, error: undefined });
    try {
      const vaults = await horizonDB.vaults.toArray();
      const dueCards = await horizonDB.flashcards
        .where("nextReview")
        .belowOrEqual(Date.now())
        .limit(20)
        .toArray();

      set({
        vaults,
        dueCards,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  createVault: async (title, topic, description = "") => {
    const now = Date.now();
    const vault: Vault = {
      id: createId(),
      title,
      description,
      topic,
      status: "active",
      progress: 0,
      totalLessons: 0,
      completedLessons: 0,
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.vaults.add(vault);
    set(state => ({ vaults: [...state.vaults, vault] }));
    return vault;
  },

  updateVault: async (id, updates) => {
    await horizonDB.vaults.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
    set(state => ({
      vaults: state.vaults.map(v => v.id === id ? { ...v, ...updates } : v),
      currentVault: state.currentVault?.id === id
        ? { ...state.currentVault, ...updates }
        : state.currentVault
    }));
  },

  deleteVault: async (id) => {
    await horizonDB.vaults.delete(id);
    await horizonDB.lessons.where("vaultId").equals(id).delete();
    set(state => ({
      vaults: state.vaults.filter(v => v.id !== id),
      currentVault: state.currentVault?.id === id ? null : state.currentVault,
      lessons: state.currentVault?.id === id ? [] : state.lessons
    }));
  },

  selectVault: async (id) => {
    const vault = await horizonDB.vaults.get(id);
    const lessons = await horizonDB.lessons.where("vaultId").equals(id).toArray();

    set({
      currentVault: vault || null,
      lessons: lessons.sort((a, b) => a.order - b.order)
    });
  },

  createLesson: async (vaultId, title, content, order = 0) => {
    const now = Date.now();
    const lesson: Lesson = {
      id: createId(),
      vaultId,
      title,
      content,
      summary: content.slice(0, 200),
      order,
      status: "pending",
      duration: 15,
      createdAt: now,
      updatedAt: now,
      embeddingId: null
    };

    await horizonDB.lessons.add(lesson);
    set(state => ({ lessons: [...state.lessons, lesson] }));

    const vault = await horizonDB.vaults.get(vaultId);
    if (vault) {
      await horizonDB.vaults.update(vaultId, {
        totalLessons: vault.totalLessons + 1,
        updatedAt: now
      });
    }

    return lesson;
  },

  updateLesson: async (id, updates) => {
    await horizonDB.lessons.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
    set(state => ({
      lessons: state.lessons.map(l => l.id === id ? { ...l, ...updates } : l),
      currentLesson: state.currentLesson?.id === id
        ? { ...state.currentLesson, ...updates }
        : state.currentLesson
    }));
  },

  updateLessonStatus: async (id, status) => {
    const lesson = await horizonDB.lessons.get(id);
    if (!lesson) return;

    await horizonDB.lessons.update(id, { status, updatedAt: Date.now() });

    const lessons = await horizonDB.lessons.where("vaultId").equals(lesson.vaultId).toArray();
    const completed = lessons.filter(l => l.status === "completed").length;
    const total = lessons.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await horizonDB.vaults.update(lesson.vaultId, {
      progress,
      completedLessons: completed
    });

    set(state => ({
      lessons: state.lessons.map(l => l.id === id ? { ...l, status } : l),
      vaults: state.vaults.map(v =>
        v.id === lesson.vaultId ? { ...v, progress, completedLessons: completed } : v
      )
    }));
  },

  deleteLesson: async (id) => {
    const lesson = await horizonDB.lessons.get(id);
    await horizonDB.lessons.delete(id);
    set(state => ({
      lessons: state.lessons.filter(l => l.id !== id),
      currentLesson: state.currentLesson?.id === id ? null : state.currentLesson
    }));

    if (lesson) {
      const vault = await horizonDB.vaults.get(lesson.vaultId);
      if (vault) {
        const totalLessons = Math.max(0, vault.totalLessons - 1);
        await horizonDB.vaults.update(lesson.vaultId, {
          totalLessons,
          updatedAt: Date.now()
        });
      }
    }
  },

  selectLesson: async (id) => {
    const lesson = await horizonDB.lessons.get(id);
    set({ currentLesson: lesson || null });
  },

  createFlashcard: async (front, back, lessonId) => {
    const now = Date.now();
    const flashcard: Flashcard = {
      id: createId(),
      lessonId: lessonId || null,
      front,
      back,
      nextReview: now,
      interval: 1,
      easeFactor: 2.5,
      reps: 0,
      lapses: 0,
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.flashcards.add(flashcard);
    set(state => ({ flashcards: [...state.flashcards, flashcard] }));
    return flashcard;
  },

  getDueCards: async (limit = 20) => {
    const dueCards = await horizonDB.flashcards
      .where("nextReview")
      .belowOrEqual(Date.now())
      .limit(limit)
      .toArray();
    set({ dueCards });
  },

  reviewFlashcard: async (id, result) => {
    const card = await horizonDB.flashcards.get(id);
    if (!card) return;

    const { rating } = result;
    let { interval, easeFactor, reps, lapses } = card;

    if (rating === "again") {
      interval = 1;
      reps = 0;
      lapses++;
    } else {
      reps++;
      if (reps === 1) {
        interval = rating === "easy" ? 4 : rating === "good" ? 2 : 1;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    easeFactor = Math.max(1.3, easeFactor + (rating === "easy" ? 0.1 : rating === "again" ? -0.2 : 0));

    await horizonDB.flashcards.update(id, {
      interval,
      easeFactor,
      reps,
      lapses,
      nextReview: Date.now() + interval * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    });

    set(state => ({
      dueCards: state.dueCards.filter(c => c.id !== id)
    }));
  }
}));