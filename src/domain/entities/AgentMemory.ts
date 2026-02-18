export type MemoryType = "episodic" | "semantic" | "procedural";
export type MemoryImportance = "low" | "medium" | "high" | "critical";

export interface AgentMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  summary: string;
  importance: MemoryImportance;
  embeddingId: string | null;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  decayFactor: number;
}

export interface AgentMemorySnapshot extends AgentMemory {}

export interface MemoryRecallResult {
  memory: AgentMemory;
  relevance: number;
}