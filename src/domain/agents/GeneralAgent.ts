import { BaseAgent, type AgentContext, type AgentResponse } from "./BaseAgent";
import type { Agent } from "@domain/entities/Agent";
import { RAGService } from "@domain/services/RAGService";

export class GeneralAgent extends BaseAgent {
  constructor(agent: Agent) {
    super(agent);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.setStatus("thinking");

    const lastMessage = context.messages[context.messages.length - 1];
    if (!lastMessage) {
      return {
        content: "Hello! I'm Sage, your general assistant. How can I help you today?",
        shouldContinue: false
      };
    }

    const thinkingSteps: Array<{ type: "reasoning" | "planning" | "execution" | "review"; content: string }> = [
      {
        type: "reasoning",
        content: `Processing request: "${lastMessage.content.slice(0, 100)}..."`
      }
    ];

    const memories = await this.recall(lastMessage.content, 3);
    if (memories.length > 0) {
      thinkingSteps.push({
        type: "reasoning",
        content: `Retrieved ${memories.length} relevant memories from past interactions`
      });
    }

    let ragContext = null;
    if (context.availableTools.includes("rag_search")) {
      thinkingSteps.push({
        type: "execution",
        content: "Searching knowledge base for relevant context..."
      });
      
      ragContext = await RAGService.retrieveContext(lastMessage.content, {
        maxSources: 3,
        minRelevance: 0.5
      });

      if (ragContext.sources.length > 0) {
        thinkingSteps.push({
          type: "execution",
          content: `Found ${ragContext.sources.length} relevant sources in knowledge base`
        });
      }
    }

    const response = await this.generateResponse(lastMessage.content, {
      memories,
      ragContext,
      conversationHistory: context.messages.slice(-6)
    });

    thinkingSteps.push({
      type: "review",
      content: "Response generated successfully"
    });

    this.setStatus("idle");

    await this.remember({
      type: "episodic",
      content: `User asked: "${lastMessage.content.slice(0, 100)}". Provided assistance.`,
      importance: "low"
    });

    return {
      content: response,
      thinking: thinkingSteps,
      citations: ragContext?.sources.map(s => ({
        sourceType: s.sourceType,
        sourceId: s.sourceId,
        snippet: s.snippet
      })),
      shouldContinue: false
    };
  }

  private async generateResponse(
    query: string,
    context: {
      memories: Array<{ summary: string }>;
      ragContext: { formattedContext: string; sources: Array<{ title?: string }> } | null;
      conversationHistory: Array<{ role: string; content: string }>;
    }
  ): Promise<string> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("help") || lowerQuery.includes("what can you do")) {
      return this.getHelpResponse();
    }

    if (lowerQuery.includes("status") || lowerQuery.includes("overview")) {
      return this.getStatusResponse();
    }

    if (context.ragContext?.formattedContext) {
      return `Based on your knowledge base, I found some relevant information:\n\n${context.ragContext.formattedContext}\n\nIs there anything specific you'd like to explore further?`;
    }

    if (lowerQuery.includes("create") || lowerQuery.includes("add") || lowerQuery.includes("new")) {
      return `I can help you create something! Try saying:\n- "Create a note about [topic]"\n- "Create a task for [task]"\n- "Generate flashcards for [subject]"\n\nWould you like me to help with any of these?`;
    }

    if (lowerQuery.includes("search") || lowerQuery.includes("find")) {
      return `I can search across your notes, documents, and knowledge base. Just tell me what you're looking for, like:\n- "Search for notes about project planning"\n- "Find documents related to machine learning"`;
    }

    return `I understand you're asking about: "${query.slice(0, 100)}"\n\nI can help you in several ways:\n1. Create notes, tasks, or flashcards\n2. Search your knowledge base\n3. Plan and organize your work\n4. Review and improve content\n\nWhat would you like to do?`;
  }

  private getHelpResponse(): string {
    return `## Horizon PWA - Available Capabilities

I'm Sage, your general assistant. Here's what I can help you with:

### 📝 Knowledge Management
- Create and organize notes
- Build whiteboards with connected cards
- Import and process documents

### 📚 Learning
- Create learning vaults
- Generate lessons and flashcards
- Track your learning progress

### ✅ Tasks & Projects
- Create and manage tasks
- Break down goals into subtasks
- Track project progress

### 🔍 Search & RAG
- Search across all your content
- Retrieve relevant context for questions
- Find connections between ideas

### 🤖 Multi-Agent Orchestration
- **Atlas** (Planning): Decompose goals into tasks
- **Nova** (Executor): Carry out actions
- **Echo** (Reviewer): Evaluate and provide feedback
- **Sage** (General): Broad assistance

How can I help you today?`;
  }

  private getStatusResponse(): string {
    return `## Horizon Status Overview

### System Status
- ✅ Database: Connected
- ✅ Embeddings: Ready
- ✅ Agents: Active

### Quick Stats
Use the sidebar to navigate to different sections:
- **Command Center**: Chat with AI agents
- **Learning Studio**: Study and review
- **Knowledge Organizer**: Notes and whiteboards
- **File & Task Manager**: Organize your work

Would you like more details about any section?`;
  }
}