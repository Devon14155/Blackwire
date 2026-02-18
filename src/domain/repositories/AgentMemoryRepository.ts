import type { AgentMemory, MemoryRecallResult } from "@domain/entities/AgentMemory";

export interface AgentMemoryRepository {
  getById(id: string): Promise<AgentMemory | null>;
  getByAgentId(agentId: string): Promise<AgentMemory[]>;
  getByType(agentId: string, type: string): Promise<AgentMemory[]>;
  save(memory: AgentMemory): Promise<void>;
  delete(id: string): Promise<void>;
  recall(agentId: string, query: string, limit?: number): Promise<MemoryRecallResult[]>;
  prune(agentId: string, maxAge?: number): Promise<void>;
}