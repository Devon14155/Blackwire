export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  dueDate: number | null;
  completedAt: number | null;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSnapshot extends Project {}