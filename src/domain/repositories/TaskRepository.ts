import type { Task, TaskStatus } from "@domain/entities/Task";

export interface TaskRepository {
  getById(id: string): Promise<Task | null>;
  getByProjectId(projectId: string): Promise<Task[]>;
  getByStatus(status: TaskStatus): Promise<Task[]>;
  getAll(): Promise<Task[]>;
  getPending(): Promise<Task[]>;
  getOverdue(): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: TaskStatus): Promise<void>;
}