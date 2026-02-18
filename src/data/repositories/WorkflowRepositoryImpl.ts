import type { WorkflowRepository } from "@domain/repositories/WorkflowRepository";
import type { Workflow, WorkflowStatus } from "@domain/entities/Workflow";
import { horizonDB } from "@core/database/horizonDB";

export class WorkflowRepositoryImpl implements WorkflowRepository {
  async getById(id: string): Promise<Workflow | null> {
    const workflow = await horizonDB.workflows.get(id);
    return workflow || null;
  }

  async getByStatus(status: WorkflowStatus): Promise<Workflow[]> {
    return horizonDB.workflows.where("status").equals(status).toArray();
  }

  async getActive(): Promise<Workflow[]> {
    const workflows = await horizonDB.workflows.toArray();
    return workflows.filter(w => 
      w.status === "running" || w.status === "pending" || w.status === "paused"
    );
  }

  async save(workflow: Workflow): Promise<void> {
    await horizonDB.workflows.put({ ...workflow, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.workflows.delete(id);
  }
}