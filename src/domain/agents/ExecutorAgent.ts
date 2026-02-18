import { BaseAgent, type AgentContext, type AgentResponse } from "./BaseAgent";
import type { Agent } from "@domain/entities/Agent";
import type { ToolResult } from "@domain/entities/Tool";
import { createId } from "@core/utils/uuid";

export interface ToolExecutor {
  (name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

export class ExecutorAgent extends BaseAgent {
  private toolExecutor: ToolExecutor | null = null;

  constructor(agent: Agent) {
    super(agent);
  }

  setToolExecutor(executor: ToolExecutor): void {
    this.toolExecutor = executor;
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.setStatus("thinking");

    const lastMessage = context.messages[context.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return {
        content: "I'm ready to execute. What action would you like me to perform?",
        shouldContinue: false
      };
    }

    const thinkingSteps: Array<{ type: "reasoning" | "planning" | "execution" | "review"; content: string }> = [
      {
        type: "reasoning",
        content: `Analyzing request for action: "${lastMessage.content.slice(0, 100)}..."`
      }
    ];

    const actions = await this.identifyActions(lastMessage.content, context);

    if (actions.length === 0) {
      this.setStatus("idle");
      return {
        content: "I couldn't identify a specific action to take. Could you clarify what you'd like me to do? For example:\n- Create a note about...\n- Search for...\n- Generate flashcards from...",
        thinking: thinkingSteps,
        shouldContinue: false
      };
    }

    this.setStatus("executing");

    const results: Array<{ action: Action; result: ToolResult }> = [];

    for (const action of actions) {
      thinkingSteps.push({
        type: "execution" as const,
        content: `Executing: ${action.tool} with arguments ${JSON.stringify(action.args)}`
      });

      const result = await this.executeTool(action.tool, action.args);
      results.push({ action, result });
    }

    this.setStatus("idle");

    const response = this.formatResponse(results);
    thinkingSteps.push({
      type: "review" as const,
      content: `Completed ${results.length} action(s).`
    });

    await this.remember({
      type: "procedural",
      content: `Executed actions: ${results.map(r => r.action.tool).join(", ")}. Results: ${results.map(r => r.result.success ? "success" : "failed").join(", ")}`,
      importance: results.every(r => r.result.success) ? "medium" : "high"
    });

    return {
      content: response,
      thinking: thinkingSteps,
      toolCalls: results.map(r => ({
        toolName: r.action.tool,
        arguments: r.action.args,
        result: r.result.data
      })),
      shouldContinue: false
    };
  }

  private async identifyActions(content: string, context: AgentContext): Promise<Action[]> {
    const actions: Action[] = [];
    const contentLower = content.toLowerCase();

    if (contentLower.includes("create note") || contentLower.includes("add note") || contentLower.includes("new note")) {
      const topic = this.extractTopic(content);
      actions.push({
        tool: "create_note",
        args: {
          title: topic,
          content: ""
        }
      });
    }

    if (contentLower.includes("create task") || contentLower.includes("add task") || contentLower.includes("new task")) {
      const taskTitle = this.extractTopic(content);
      actions.push({
        tool: "create_task",
        args: {
          title: taskTitle,
          priority: "medium"
        }
      });
    }

    if (contentLower.includes("create flashcard") || contentLower.includes("generate flashcard")) {
      const topic = this.extractTopic(content);
      actions.push({
        tool: "create_flashcards",
        args: {
          topic,
          count: 3
        }
      });
    }

    if (contentLower.includes("search") || contentLower.includes("find")) {
      const query = this.extractSearchQuery(content);
      actions.push({
        tool: "search_all",
        args: { query }
      });
    }

    if (contentLower.includes("summarize") || contentLower.includes("summary of")) {
      const topic = this.extractTopic(content);
      actions.push({
        tool: "summarize_content",
        args: { topic }
      });
    }

    if (contentLower.includes("save") && contentLower.includes("to knowledge")) {
      actions.push({
        tool: "save_to_knowledge",
        args: {
          content: this.extractContent(content)
        }
      });
    }

    return actions;
  }

  private async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    if (this.toolExecutor) {
      return this.toolExecutor(name, args);
    }

    return {
      success: false,
      error: `Tool "${name}" not available - no tool executor configured`
    };
  }

  private extractTopic(content: string): string {
    const patterns = [
      /(?:about|on|for|titled?|called)\s+["']?([^"'\n]+)["']?/i,
      /(?:create|add|new)\s+(?:a\s+)?(?:note|task|card)\s+["']?([^"'\n]+)["']?/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return "Untitled";
  }

  private extractSearchQuery(content: string): string {
    const patterns = [
      /(?:search|find)\s+(?:for\s+)?["']?([^"'\n]+)["']?/i,
      /(?:search|find)\s+(?:for\s+)?(.+?)(?:\s+in|\s*$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return content.replace(/search|find|for/gi, "").trim();
  }

  private extractContent(content: string): string {
    const match = content.match(/(?:save|store)\s+["']?([^"'\n]+)["']?\s+to/i);
    return match ? match[1].trim() : "";
  }

  private formatResponse(results: Array<{ action: Action; result: ToolResult }>): string {
    const successCount = results.filter(r => r.result.success).length;
    const failCount = results.length - successCount;

    let response = "";

    if (successCount > 0) {
      response += `✅ Successfully completed ${successCount} action(s):\n`;
      results
        .filter(r => r.result.success)
        .forEach(r => {
          response += `- ${r.action.tool}: ${r.result.data ? JSON.stringify(r.result.data).slice(0, 100) : "Done"}\n`;
        });
    }

    if (failCount > 0) {
      response += `\n❌ Failed to complete ${failCount} action(s):\n`;
      results
        .filter(r => !r.result.success)
        .forEach(r => {
          response += `- ${r.action.tool}: ${r.result.error || "Unknown error"}\n`;
        });
    }

    response += "\nIs there anything else you'd like me to do?";

    return response;
  }
}

interface Action {
  tool: string;
  args: Record<string, unknown>;
}