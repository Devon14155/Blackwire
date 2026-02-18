import type { Project, ProjectStatus } from "@domain/entities/Project";

export interface ProjectRepository {
  getById(id: string): Promise<Project | null>;
  getAll(): Promise<Project[]>;
  getByStatus(status: ProjectStatus): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}