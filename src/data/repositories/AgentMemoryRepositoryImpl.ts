import type { AgentMemoryRepository } from "@domain/repositories/AgentMemoryRepository";
import type { AgentMemory, MemoryRecallResult } from "@domain/entities/AgentMemory";
import { horizonDB } from "@core/database/horizonDB";

export class AgentMemoryRepositoryImpl implements AgentMemoryRepository {
  async getById(id: string): Promise<AgentMemory | null> {
    const memory = await horizonDB.agentMemories.get(id);
    return memory || null;
  }

  async getByAgentId(agentId: string): Promise<AgentMemory[]> {
    return horizonDB.agentMemories.where("agentId").equals(agentId).toArray();
  }

  async getByType(agentId: string, type: string): Promise<AgentMemory[]> {
    const memories = await horizonDB.agentMemories
      .where("agentId")
      .equals(agentId)
      .toArray();
    
    return memories.filter(m => m.type === type);
  }

  async save(memory: AgentMemory): Promise<void> {
    await horizonDB.agentMemories.put(memory);
  }

  async delete(id: string): Promise<void> {
    await horizonDB.agentMemories.delete(id);
  }

  async recall(agentId: string, query: string, limit: number = 5): Promise<MemoryRecallResult[]> {
    const memories = await this.getByAgentId(agentId);
    
    const results: MemoryRecallResult[] = memories.map(memory => {
      const queryLower = query.toLowerCase();
      const contentLower = memory.content.toLowerCase();
      const summaryLower = memory.summary.toLowerCase();
      
      let relevance = 0;
      
      if (contentLower.includes(queryLower) || summaryLower.includes(queryLower)) {
        relevance = 0.8;
      } else {
        const queryWords = queryLower.split(/\s+/);
        const contentWords = new Set(contentLower.split(/\s+/));
        const overlap = queryWords.filter(w => contentWords.has(w) && w.length > 3).length;
        relevance = Math.min(overlap / queryWords.length, 0.5);
      }
      
      const importanceScore = memory.importance === "critical" ? 1.0 :
                             memory.importance === "high" ? 0.8 :
                             memory.importance === "medium" ? 0.5 : 0.3;
      
      const ageDays = (Date.now() - memory.lastAccessed) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - ageDays / 30);
      
      relevance = relevance * 0.5 + importanceScore * 0.3 + recencyScore * 0.2;

      return { memory, relevance };
    });

    results.sort((a, b) => b.relevance - a.relevance);
    
    const topResults = results.slice(0, limit);
    
    await Promise.all(
      topResults.map(({ memory }) =>
        horizonDB.agentMemories.update(memory.id, {
          lastAccessed: Date.now(),
          accessCount: memory.accessCount + 1
        })
      )
    );

    return topResults;
  }

  async prune(agentId: string, maxAge: number = 90): Promise<void> {
    const cutoff = Date.now() - maxAge * 24 * 60 * 60 * 1000;
    
    const memories = await this.getByAgentId(agentId);
    
    for (const memory of memories) {
      if (memory.lastAccessed < cutoff && memory.importance !== "critical") {
        await horizonDB.agentMemories.delete(memory.id);
      }
    }
  }
}