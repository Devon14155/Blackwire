import type { ProjectRepository } from "@domain/repositories/ProjectRepository";
import type { Project, ProjectStatus } from "@domain/entities/Project";
import { horizonDB } from "@core/database/horizonDB";

export class ProjectRepositoryImpl implements ProjectRepository {
  async getById(id: string): Promise<Project | null> {
    const project = await horizonDB.projects.get(id);
    return project || null;
  }

  async getAll(): Promise<Project[]> {
    return horizonDB.projects.toArray();
  }

  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    return horizonDB.projects.where("status").equals(status).toArray();
  }

  async save(project: Project): Promise<void> {
    await horizonDB.projects.put({ ...project, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.projects.delete(id);
  }
}