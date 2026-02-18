import { BaseAgent, type AgentContext, type AgentResponse } from "./BaseAgent";
import type { Agent } from "@domain/entities/Agent";
import type { Task, TaskPriority } from "@domain/entities/Task";
import { createId } from "@core/utils/uuid";
import { horizonDB } from "@core/database/horizonDB";

export class PlanningAgent extends BaseAgent {
  constructor(agent: Agent) {
    super(agent);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.setStatus("thinking");

    const lastMessage = context.messages[context.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return {
        content: "I'm ready to help you plan. What goal would you like me to decompose?",
        shouldContinue: false
      };
    }

    const memories = await this.recall(lastMessage.content, 3);
    
    const thinkingSteps: Array<{ type: "reasoning" | "planning" | "execution" | "review"; content: string }> = [
      {
        type: "reasoning",
        content: `Analyzing the request: "${lastMessage.content.slice(0, 100)}..."`
      },
      {
        type: "planning",
        content: "Identifying key objectives and breaking down into actionable steps..."
      }
    ];

    const goal = await this.parseGoal(lastMessage.content);
    const subtasks = await this.decomposeGoal(goal, context);

    if (subtasks.length > 0) {
      await this.createTasksFromPlan(subtasks, context.conversationId);
      
      thinkingSteps.push({
        type: "execution" as const,
        content: `Created ${subtasks.length} subtasks based on the plan.`
      });
    }

    this.setStatus("idle");

    const response = this.formatResponse(goal, subtasks);

    await this.remember({
      type: "episodic",
      content: `User requested planning for: ${goal}. Created ${subtasks.length} subtasks.`,
      importance: "medium"
    });

    return {
      content: response,
      thinking: thinkingSteps,
      toolCalls: subtasks.map(task => ({
        toolName: "create_task",
        arguments: {
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate
        }
      })),
      shouldContinue: false
    };
  }

  private async parseGoal(content: string): Promise<string> {
    const lines = content.split("\n").filter(l => l.trim());
    return lines[0] || content.slice(0, 200);
  }

  private async decomposeGoal(goal: string, context: AgentContext): Promise<PlannedTask[]> {
    const tasks: PlannedTask[] = [];
    
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes("learn") || goalLower.includes("study") || goalLower.includes("understand")) {
      tasks.push(
        { title: `Research ${goal.slice(0, 50)}`, priority: "high" as TaskPriority, dueDate: null },
        { title: "Create study notes", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Generate flashcards for key concepts", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Schedule review sessions", priority: "low" as TaskPriority, dueDate: null }
      );
    } else if (goalLower.includes("build") || goalLower.includes("create") || goalLower.includes("develop")) {
      tasks.push(
        { title: "Define requirements and scope", priority: "high" as TaskPriority, dueDate: null },
        { title: "Research best practices", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Create implementation plan", priority: "high" as TaskPriority, dueDate: null },
        { title: "Set up project structure", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Implement core functionality", priority: "high" as TaskPriority, dueDate: null },
        { title: "Test and validate", priority: "medium" as TaskPriority, dueDate: null }
      );
    } else if (goalLower.includes("organize") || goalLower.includes("manage")) {
      tasks.push(
        { title: "Assess current state", priority: "high" as TaskPriority, dueDate: null },
        { title: "Define organization structure", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Create categories/tags", priority: "low" as TaskPriority, dueDate: null },
        { title: "Implement organization system", priority: "medium" as TaskPriority, dueDate: null }
      );
    } else {
      tasks.push(
        { title: `Analyze: ${goal.slice(0, 50)}`, priority: "high" as TaskPriority, dueDate: null },
        { title: "Break down into smaller tasks", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Prioritize and sequence", priority: "medium" as TaskPriority, dueDate: null },
        { title: "Execute first step", priority: "high" as TaskPriority, dueDate: null }
      );
    }

    return tasks;
  }

  private async createTasksFromPlan(tasks: PlannedTask[], conversationId: string): Promise<void> {
    for (const task of tasks) {
      const newTask: Task = {
        id: createId(),
        projectId: null,
        title: task.title,
        description: `Created by planning agent from conversation ${conversationId}`,
        status: "todo",
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: null,
        estimatedMinutes: null,
        actualMinutes: null,
        dependencies: [],
        labels: ["planned"],
        embeddingId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await horizonDB.tasks.add(newTask);
    }
  }

  private formatResponse(goal: string, tasks: PlannedTask[]): string {
    if (tasks.length === 0) {
      return `I've analyzed your goal: "${goal.slice(0, 100)}". Could you provide more details so I can create a more specific plan?`;
    }

    const taskList = tasks
      .map((t, i) => `${i + 1}. **${t.title}** (priority: ${t.priority})`)
      .join("\n");

    return `I've decomposed your goal into the following actionable tasks:

${taskList}

Would you like me to:
- Adjust priorities or add deadlines?
- Create a project to group these tasks?
- Elaborate on any specific step?`;
  }
}

interface PlannedTask {
  title: string;
  priority: TaskPriority;
  dueDate: number | null;
}