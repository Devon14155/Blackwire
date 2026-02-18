import { BaseAgent, type AgentContext, type AgentResponse } from "@domain/agents/BaseAgent";
import { PlanningAgent } from "@domain/agents/PlanningAgent";
import { ExecutorAgent } from "@domain/agents/ExecutorAgent";
import { ReviewerAgent } from "@domain/agents/ReviewerAgent";
import { GeneralAgent } from "@domain/agents/GeneralAgent";
import type { Agent, AgentStatus } from "@domain/entities/Agent";
import { DEFAULT_AGENTS } from "@domain/entities/Agent";
import type { Message } from "@domain/entities/Message";
import { horizonDB } from "@core/database/horizonDB";
import { createId } from "@core/utils/uuid";
import { ToolRegistry } from "@domain/tools/ToolRegistry";

export interface OrchestratorConfig {
  maxIterations: number;
  enableMemory: boolean;
  enableRAG: boolean;
}

export interface OrchestrationResult {
  content: string;
  agentUsed: string;
  thinking?: Message["thinking"];
  toolCalls?: Message["toolCalls"];
  citations?: Message["citations"];
  iterations: number;
  metadata: Record<string, unknown>;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxIterations: 3,
  enableMemory: true,
  enableRAG: true
};

class AgentOrchestratorClass {
  private agents: Map<string, BaseAgent> = new Map();
  private agentConfigs: Map<string, Agent> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    for (const defaultAgent of DEFAULT_AGENTS) {
      const agent: Agent = {
        ...defaultAgent,
        id: createId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const existingMemory = await horizonDB.agentMemories
        .where("agentId")
        .equals(agent.id)
        .first();

      if (!existingMemory) {
        await horizonDB.agentMemories.add({
          id: createId(),
          agentId: agent.id,
          type: "semantic",
          content: `Agent ${agent.name} initialized`,
          summary: `${agent.name} ready for use`,
          importance: "low",
          embeddingId: null,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
          decayFactor: 1.0
        });
      }

      const agentInstance = this.createAgentInstance(agent);
      this.agents.set(agent.id, agentInstance);
      this.agentConfigs.set(agent.id, agent);
    }

    this.initialized = true;
  }

  private createAgentInstance(agent: Agent): BaseAgent {
    switch (agent.type) {
      case "planning":
        return new PlanningAgent(agent);
      case "executor":
        return new ExecutorAgent(agent);
      case "reviewer":
        return new ReviewerAgent(agent);
      case "general":
      default:
        return new GeneralAgent(agent);
    }
  }

  getAgentById(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAgentByType(type: string): BaseAgent | undefined {
    for (const [id, agent] of this.agentConfigs) {
      if (agent.type === type) {
        return this.agents.get(id);
      }
    }
    return undefined;
  }

  getAgentConfig(id: string): Agent | undefined {
    return this.agentConfigs.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agentConfigs.values());
  }

  getAgentStatus(id: string): AgentStatus {
    const agent = this.agents.get(id);
    return agent?.currentStatus || "idle";
  }

  async routeTask(
    message: string,
    conversationId: string,
    messages: Message[],
    config: OrchestratorConfig = DEFAULT_CONFIG
  ): Promise<OrchestrationResult> {
    await this.initialize();

    const taskType = this.classifyTask(message);
    const agent = this.selectAgent(taskType);

    if (!agent) {
      throw new Error("No suitable agent found for task");
    }

    const agentConfig = this.getAgentConfigFromInstance(agent);
    const memories = config.enableMemory
      ? await agent.recall(message, 3)
      : [];

    const context: AgentContext = {
      conversationId,
      messages,
      availableTools: agentConfig?.config.tools || [],
      memories,
      metadata: { taskType }
    };

    let result: AgentResponse;
    let iterations = 0;

    while (iterations < config.maxIterations) {
      result = await agent.execute(context);

      iterations++;

      if (!result.shouldContinue) {
        return {
          content: result.content,
          agentUsed: agentConfig?.name || "Unknown",
          thinking: this.convertThinkingSteps(result.thinking),
          toolCalls: this.convertToolCalls(result.toolCalls),
          citations: this.convertCitations(result.citations),
          iterations,
          metadata: { taskType }
        };
      }

      context.messages.push({
        id: createId(),
        role: "assistant",
        content: result.content,
        createdAt: Date.now()
      });
    }

    return {
      content: "Maximum iterations reached. Task may require more context or clarification.",
      agentUsed: agentConfig?.name || "Unknown",
      iterations,
      metadata: { taskType, stopped: "max_iterations" }
    };
  }

  private getAgentConfigFromInstance(agent: BaseAgent): Agent | undefined {
    for (const [id, agentInstance] of this.agents) {
      if (agentInstance === agent) {
        return this.agentConfigs.get(id);
      }
    }
    return undefined;
  }

  private classifyTask(message: string): TaskType {
    const lower = message.toLowerCase();

    if (/plan|organize|break down|decompose|schedule|timeline|roadmap/.test(lower)) {
      return "planning";
    }

    if (/create|add|new|generate|make|build|execute|run|perform/.test(lower)) {
      return "execution";
    }

    if (/review|check|evaluate|assess|feedback|improve|analyze quality/.test(lower)) {
      return "review";
    }

    return "general";
  }

  private selectAgent(taskType: TaskType): BaseAgent | undefined {
    switch (taskType) {
      case "planning":
        return this.getAgentByType("planning");
      case "execution":
        return this.getAgentByType("executor");
      case "review":
        return this.getAgentByType("reviewer");
      default:
        return this.getAgentByType("general");
    }
  }

  private convertThinkingSteps(
    steps?: Array<{ type: string; content: string }>
  ): Message["thinking"] | undefined {
    if (!steps || steps.length === 0) return undefined;

    return steps.map((step, index) => ({
      id: createId(),
      type: step.type as "reasoning" | "planning" | "execution" | "review",
      content: step.content,
      timestamp: Date.now() + index
    }));
  }

  private convertToolCalls(
    calls?: Array<{ toolName: string; arguments: Record<string, unknown>; result?: unknown }>
  ): Message["toolCalls"] | undefined {
    if (!calls || calls.length === 0) return undefined;

    return calls.map(call => ({
      toolCallId: createId(),
      toolName: call.toolName,
      arguments: call.arguments,
      result: call.result,
      status: "success" as const
    }));
  }

  private convertCitations(
    citations?: Array<{ sourceType: string; sourceId: string; snippet: string }>
  ): Message["citations"] | undefined {
    if (!citations || citations.length === 0) return undefined;

    return citations.map(c => ({
      citationId: createId(),
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      snippet: c.snippet
    }));
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    return ToolRegistry.execute(name, args);
  }
}

type TaskType = "planning" | "execution" | "review" | "general";

export const AgentOrchestrator = new AgentOrchestratorClass();