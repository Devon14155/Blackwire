export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: number | null;
  completedAt: number | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  dependencies: string[];
  labels: string[];
  embeddingId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TaskSnapshot extends Task {}