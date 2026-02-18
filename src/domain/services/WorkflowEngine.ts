import { horizonDB } from "@core/database/horizonDB";
import { createId } from "@core/utils/uuid";
import type { Workflow, WorkflowStep, WorkflowStatus, WorkflowType } from "@domain/entities/Workflow";
import { WORKFLOW_TEMPLATES } from "@domain/entities/Workflow";
import { ToolRegistry } from "@domain/tools/ToolRegistry";

export interface WorkflowExecutionContext {
  workflowId: string;
  input: Record<string, unknown>;
  currentStepIndex: number;
  results: Record<string, unknown>;
}

export class WorkflowEngine {
  async createWorkflow(
    type: WorkflowType,
    input: Record<string, unknown>,
    triggeredBy: "user" | "agent" | "schedule" | "event" = "user"
  ): Promise<Workflow> {
    const template = WORKFLOW_TEMPLATES.find(t => t.type === type);
    
    if (!template) {
      throw new Error(`Unknown workflow type: ${type}`);
    }

    const id = createId();
    const now = Date.now();

    const steps: WorkflowStep[] = template.steps.map((step, index) => ({
      id: `step-${index}`,
      name: step.name,
      type: step.type,
      status: "pending" as const,
      input: index === 0 ? input : {},
      dependencies: step.dependencies
    }));

    const workflow: Workflow = {
      id,
      type,
      name: template.name,
      description: template.description,
      status: "pending",
      steps,
      currentStepIndex: 0,
      context: { input },
      triggeredBy,
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.workflows.add(workflow);
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await horizonDB.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== "pending" && workflow.status !== "paused") {
      throw new Error(`Workflow is not in a runnable state: ${workflow.status}`);
    }

    await this.updateWorkflowStatus(workflowId, "running");

    const context: WorkflowExecutionContext = {
      workflowId,
      input: workflow.context.input as Record<string, unknown>,
      currentStepIndex: workflow.currentStepIndex,
      results: workflow.context.results as Record<string, unknown> || {}
    };

    try {
      while (context.currentStepIndex < workflow.steps.length) {
        const step = workflow.steps[context.currentStepIndex];
        
        const depsComplete = this.checkDependencies(step, workflow.steps);
        if (!depsComplete) {
          await this.updateStepStatus(workflowId, step.id, "skipped");
          context.currentStepIndex++;
          continue;
        }

        await this.executeStep(workflowId, step, context);
        context.currentStepIndex++;
      }

      await this.updateWorkflowStatus(workflowId, "completed");
      await horizonDB.workflows.update(workflowId, {
        completedAt: Date.now(),
        result: context.results
      });

      return (await horizonDB.workflows.get(workflowId))!;
    } catch (error) {
      await this.updateWorkflowStatus(workflowId, "failed");
      await horizonDB.workflows.update(workflowId, {
        steps: workflow.steps.map(s =>
          s.status === "running" ? { ...s, status: "failed" as const, error: String(error) } : s
        )
      });
      throw error;
    }
  }

  private async executeStep(
    workflowId: string,
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<void> {
    await this.updateStepStatus(workflowId, step.id, "running", Date.now());

    try {
      const stepInput = this.resolveStepInput(step, context);
      const result = await this.executeStepAction(step.type, stepInput);

      await this.updateStepStatus(workflowId, step.id, "completed", undefined, Date.now(), result);
      context.results[step.id] = result;
    } catch (error) {
      await this.updateStepStatus(
        workflowId,
        step.id,
        "failed",
        undefined,
        Date.now(),
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private resolveStepInput(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = { ...step.input };

    for (const depId of step.dependencies) {
      const depResult = context.results[depId];
      if (depResult && typeof depResult === "object") {
        Object.assign(resolved, depResult);
      }
    }

    return { ...resolved, ...context.input };
  }

  private async executeStepAction(
    type: string,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const toolMap: Record<string, string> = {
      research: "search_all",
      create_note: "create_note",
      create_flashcards: "create_flashcards",
      create_tasks: "create_task",
      create_whiteboard: "create_whiteboard",
      read_document: "read_document",
      summarize_content: "summarize_content",
      search: "search_all",
      parse: "search_all",
      extract_actions: "summarize_content",
      analyze_content: "summarize_content",
      generate_questions: "create_flashcards"
    };

    const toolName = toolMap[type] || type;
    const result = await ToolRegistry.execute(toolName, input);

    if (!result.success) {
      throw new Error(result.error || `Step ${type} failed`);
    }

    return result.data as Record<string, unknown>;
  }

  private checkDependencies(step: WorkflowStep, allSteps: WorkflowStep[]): boolean {
    for (const depId of step.dependencies) {
      const dep = allSteps.find(s => s.id === depId || s.name === depId);
      if (dep && dep.status !== "completed") {
        return false;
      }
    }
    return true;
  }

  private async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
    await horizonDB.workflows.update(workflowId, {
      status,
      updatedAt: Date.now()
    });
  }

  private async updateStepStatus(
    workflowId: string,
    stepId: string,
    status: WorkflowStep["status"],
    startedAt?: number,
    completedAt?: number,
    output?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    const workflow = await horizonDB.workflows.get(workflowId);
    if (!workflow) return;

    const updatedSteps = workflow.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          startedAt: startedAt ?? step.startedAt,
          completedAt: completedAt ?? step.completedAt,
          output: output ?? step.output,
          error: error ?? step.error
        };
      }
      return step;
    });

    await horizonDB.workflows.update(workflowId, {
      steps: updatedSteps,
      updatedAt: Date.now()
    });
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflowStatus(workflowId, "paused");
  }

  async resumeWorkflow(workflowId: string): Promise<Workflow> {
    return this.executeWorkflow(workflowId);
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflowStatus(workflowId, "cancelled");
  }

  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    return (await horizonDB.workflows.get(workflowId)) || null;
  }

  async getActiveWorkflows(): Promise<Workflow[]> {
    return horizonDB.workflows
      .where("status")
      .equals("running")
      .or("status")
      .equals("pending")
      .toArray();
  }

  async getWorkflowHistory(limit: number = 20): Promise<Workflow[]> {
    return horizonDB.workflows
      .orderBy("createdAt")
      .reverse()
      .limit(limit)
      .toArray();
  }
}