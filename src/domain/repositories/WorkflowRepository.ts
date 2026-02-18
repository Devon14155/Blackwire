import type { Workflow, WorkflowStatus } from "@domain/entities/Workflow";

export interface WorkflowRepository {
  getById(id: string): Promise<Workflow | null>;
  getByStatus(status: WorkflowStatus): Promise<Workflow[]>;
  getActive(): Promise<Workflow[]>;
  save(workflow: Workflow): Promise<void>;
  delete(id: string): Promise<void>;
}