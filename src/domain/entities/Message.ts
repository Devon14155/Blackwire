export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ToolCallResult {
  toolCallId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  status: "success" | "error";
  error?: string;
}

export interface MessageCitation {
  citationId: string;
  sourceType: string;
  sourceId: string;
  snippet: string;
}

export interface ThinkingStep {
  id: string;
  type: "reasoning" | "planning" | "execution" | "review";
  content: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  pending?: boolean;
  error?: string;
  toolCalls?: ToolCallResult[];
  citations?: MessageCitation[];
  thinking?: ThinkingStep[];
  agentId?: string;
}
