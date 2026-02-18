import type { Message } from "./Message";

export interface ConversationContext {
  ragEnabled: boolean;
  activeAgentId: string | null;
  systemPrompt: string | null;
  citations: Citation[];
  toolCalls: ToolCallReference[];
}

export interface Citation {
  id: string;
  sourceType: "note" | "document" | "lesson" | "card";
  sourceId: string;
  snippet: string;
  relevance: number;
}

export interface ToolCallReference {
  id: string;
  toolName: string;
  status: "pending" | "success" | "error";
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agentId: string | null;
  context: ConversationContext;
  createdAt: number;
  updatedAt: number;
}
