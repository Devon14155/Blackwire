import Dexie, { type Table } from "dexie";
import type { Conversation } from "@domain/entities/Conversation";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import type { Note } from "@domain/entities/Note";
import type { Card } from "@domain/entities/Card";
import type { Whiteboard } from "@domain/entities/Whiteboard";
import type { Vault } from "@domain/entities/Vault";
import type { Lesson } from "@domain/entities/Lesson";
import type { Flashcard } from "@domain/entities/Flashcard";
import type { Quiz } from "@domain/entities/Quiz";
import type { Document } from "@domain/entities/Document";
import type { Project } from "@domain/entities/Project";
import type { Task } from "@domain/entities/Task";
import type { Embedding } from "@domain/entities/Embedding";
import type { AgentMemory } from "@domain/entities/AgentMemory";
import type { Workflow } from "@domain/entities/Workflow";

export interface ConversationRecord extends Conversation {}
export interface SettingsRecord extends ModelSettings {}
export interface NoteRecord extends Note {}
export interface CardRecord extends Card {}
export interface WhiteboardRecord extends Whiteboard {}
export interface VaultRecord extends Vault {}
export interface LessonRecord extends Lesson {}
export interface FlashcardRecord extends Flashcard {}
export interface QuizRecord extends Quiz {}
export interface DocumentRecord extends Document {}
export interface ProjectRecord extends Project {}
export interface TaskRecord extends Task {}
export interface EmbeddingRecord extends Embedding {}
export interface AgentMemoryRecord extends AgentMemory {}
export interface WorkflowRecord extends Workflow {}

class HorizonDatabase extends Dexie {
  conversations!: Table<ConversationRecord, string>;
  settings!: Table<SettingsRecord, string>;
  notes!: Table<NoteRecord, string>;
  cards!: Table<CardRecord, string>;
  whiteboards!: Table<WhiteboardRecord, string>;
  vaults!: Table<VaultRecord, string>;
  lessons!: Table<LessonRecord, string>;
  flashcards!: Table<FlashcardRecord, string>;
  quizzes!: Table<QuizRecord, string>;
  documents!: Table<DocumentRecord, string>;
  projects!: Table<ProjectRecord, string>;
  tasks!: Table<TaskRecord, string>;
  embeddings!: Table<EmbeddingRecord, string>;
  agentMemories!: Table<AgentMemoryRecord, string>;
  workflows!: Table<WorkflowRecord, string>;

  constructor() {
    super("horizon-db");
    this.version(2).stores({
      conversations: "id, updatedAt, agentId",
      settings: "id, updatedAt",
      notes: "id, title, parentId, createdAt, updatedAt, *tags, embeddingId",
      cards: "id, whiteboardId, createdAt, updatedAt, *tags, embeddingId",
      whiteboards: "id, title, parentId, createdAt, updatedAt",
      vaults: "id, title, topic, progress, createdAt, updatedAt",
      lessons: "id, vaultId, order, status, createdAt, updatedAt, embeddingId",
      flashcards: "id, lessonId, nextReview, interval, createdAt, updatedAt",
      quizzes: "id, lessonId, completedAt",
      documents: "id, filename, contentType, *tags, createdAt, updatedAt, embeddingId",
      projects: "id, title, status, priority, dueDate, createdAt, updatedAt",
      tasks: "id, projectId, status, priority, dueDate, createdAt, updatedAt, *dependencies",
      embeddings: "id, sourceType, sourceId, dimensions",
      agentMemories: "id, agentId, type, importance, createdAt, lastAccessed",
      workflows: "id, type, status, createdAt, updatedAt"
    });
  }
}

export const horizonDB = new HorizonDatabase();

export type HorizonDB = typeof horizonDB;