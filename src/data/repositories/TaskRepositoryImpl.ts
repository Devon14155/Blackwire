import type { TaskRepository } from "@domain/repositories/TaskRepository";
import type { Task, TaskStatus } from "@domain/entities/Task";
import { horizonDB } from "@core/database/horizonDB";

export class TaskRepositoryImpl implements TaskRepository {
  async getById(id: string): Promise<Task | null> {
    const task = await horizonDB.tasks.get(id);
    return task || null;
  }

  async getByProjectId(projectId: string): Promise<Task[]> {
    return horizonDB.tasks.where("projectId").equals(projectId).toArray();
  }

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    return horizonDB.tasks.where("status").equals(status).toArray();
  }

  async getAll(): Promise<Task[]> {
    return horizonDB.tasks.toArray();
  }

  async getPending(): Promise<Task[]> {
    const tasks = await horizonDB.tasks.toArray();
    return tasks.filter(t => t.status === "todo" || t.status === "in_progress");
  }

  async getOverdue(): Promise<Task[]> {
    const now = Date.now();
    const tasks = await horizonDB.tasks.toArray();
    return tasks.filter(t => 
      t.dueDate !== null && 
      t.dueDate < now && 
      t.status !== "done" && 
      t.status !== "cancelled"
    );
  }

  async save(task: Task): Promise<void> {
    await horizonDB.tasks.put({ ...task, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.tasks.delete(id);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const updates: Partial<Task> = {
      status,
      updatedAt: Date.now()
    };

    if (status === "done") {
      updates.completedAt = Date.now();
    }

    await horizonDB.tasks.update(id, updates);
  }
}