import type { Agent, AgentStatus } from "@domain/entities/Agent";
import type { Message } from "@domain/entities/Message";
import type { ToolCall, ToolResult } from "@domain/entities/Tool";
import type { AgentMemory, MemoryImportance } from "@domain/entities/AgentMemory";
import { horizonDB } from "@core/database/horizonDB";
import { createId } from "@core/utils/uuid";

export interface AgentContext {
  conversationId: string;
  messages: Message[];
  availableTools: string[];
  memories: AgentMemory[];
  metadata: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  thinking?: ThinkingStepOutput[];
  toolCalls?: ToolCallOutput[];
  citations?: CitationOutput[];
  shouldContinue: boolean;
  metadata?: Record<string, unknown>;
}

export interface ThinkingStepOutput {
  type: "reasoning" | "planning" | "execution" | "review";
  content: string;
}

export interface ToolCallOutput {
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface CitationOutput {
  sourceType: string;
  sourceId: string;
  snippet: string;
}

export interface AgentMemoryInput {
  type: "episodic" | "semantic" | "procedural";
  content: string;
  importance: MemoryImportance;
}

export abstract class BaseAgent {
  protected agent: Agent;
  protected status: AgentStatus = "idle";

  constructor(agent: Agent) {
    this.agent = agent;
  }

  get id(): string {
    return this.agent.id;
  }

  get name(): string {
    return this.agent.name;
  }

  get type(): string {
    return this.agent.type;
  }

  get currentStatus(): AgentStatus {
    return this.status;
  }

  setStatus(status: AgentStatus): void {
    this.status = status;
  }

  abstract execute(context: AgentContext): Promise<AgentResponse>;

  async remember(input: AgentMemoryInput): Promise<AgentMemory> {
    const memory: AgentMemory = {
      id: createId(),
      agentId: this.agent.id,
      type: input.type,
      content: input.content,
      summary: input.content.slice(0, 200),
      importance: input.importance,
      embeddingId: null,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      decayFactor: 1.0
    };

    await horizonDB.agentMemories.add(memory);
    return memory;
  }

  async recall(query: string, limit: number = 5): Promise<AgentMemory[]> {
    const memories = await horizonDB.agentMemories
      .where("agentId")
      .equals(this.agent.id)
      .toArray();

    memories.sort((a, b) => {
      const aScore = a.importance === "critical" ? 4 : a.importance === "high" ? 3 : a.importance === "medium" ? 2 : 1;
      const bScore = b.importance === "critical" ? 4 : b.importance === "high" ? 3 : b.importance === "medium" ? 2 : 1;
      const recencyA = Date.now() - a.lastAccessed;
      const recencyB = Date.now() - b.lastAccessed;
      const recencyScore = (recencyB - recencyA) / (1000 * 60 * 60 * 24);
      return (bScore - aScore) + (recencyScore * 0.1);
    });

    const recalled = memories.slice(0, limit);
    
    await Promise.all(
      recalled.map(memory =>
        horizonDB.agentMemories.update(memory.id, {
          lastAccessed: Date.now(),
          accessCount: memory.accessCount + 1
        })
      )
    );

    return recalled;
  }

  async forget(memoryId: string): Promise<void> {
    await horizonDB.agentMemories.delete(memoryId);
  }

  protected buildSystemPrompt(context: AgentContext): string {
    const memoryContext = context.memories.length > 0
      ? `\n\nRelevant memories:\n${context.memories.map(m => `- ${m.summary}`).join("\n")}`
      : "";

    const toolContext = context.availableTools.length > 0
      ? `\n\nAvailable tools: ${context.availableTools.join(", ")}`
      : "";

    return `${this.agent.config.systemPrompt}${memoryContext}${toolContext}`;
  }

  protected createThinkingSteps(steps: ThinkingStepOutput[]): Message["thinking"] {
    return steps.map((step, index) => ({
      id: createId(),
      type: step.type,
      content: step.content,
      timestamp: Date.now() + index
    }));
  }
}