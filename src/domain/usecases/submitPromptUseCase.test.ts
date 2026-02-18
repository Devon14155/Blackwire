import { describe, expect, it } from "vitest";
import type { Conversation } from "@domain/entities/Conversation";
import type { Message } from "@domain/entities/Message";
import type { ConversationRepository } from "@domain/repositories/ConversationRepository";
import type { AIModelGateway, CompletionChunk } from "@domain/repositories/AIModelGateway";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import { SubmitPromptUseCase } from "@domain/usecases/SubmitPromptUseCase";
import { createDefaultSettings } from "@domain/config/defaultSettings";

class InMemoryConversationRepository implements ConversationRepository {
  conversation: Conversation | null = null;

  async getActiveConversation(): Promise<Conversation | null> {
    return this.conversation;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    this.conversation = JSON.parse(JSON.stringify(conversation));
  }

  async appendMessage(conversationId: string, message: Message): Promise<void> {
    if (!this.conversation || this.conversation.id !== conversationId) {
      throw new Error("Conversation not found");
    }
    this.conversation = {
      ...this.conversation,
      messages: [...this.conversation.messages, JSON.parse(JSON.stringify(message))]
    };
  }

  async updateMessage(conversationId: string, message: Message): Promise<void> {
    if (!this.conversation || this.conversation.id !== conversationId) {
      throw new Error("Conversation not found");
    }
    this.conversation = {
      ...this.conversation,
      messages: this.conversation.messages.map((item) =>
        item.id === message.id ? JSON.parse(JSON.stringify({ ...item, ...message })) : item
      )
    };
  }

  async clear(conversationId: string): Promise<void> {
    if (this.conversation && this.conversation.id === conversationId) {
      this.conversation = { ...this.conversation, messages: [] };
    }
  }
}

class FakeGateway implements AIModelGateway {
  async createCompletion(
    conversationId: string,
    messages: Message[],
    settings: ModelSettings,
    onChunk: (chunk: CompletionChunk) => void
  ): Promise<void> {
    void conversationId;
    void settings;
    onChunk({ id: "chunk-1", content: "Hello", done: false });
    onChunk({ id: "chunk-1", content: " world", done: true });
  }
}

describe("SubmitPromptUseCase", () => {
  it("appends user message and streams assistant response", async () => {
    const repository = new InMemoryConversationRepository();
    repository.conversation = {
      id: "conv-1",
      title: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      agentId: null,
      context: {
        ragEnabled: false,
        activeAgentId: null,
        systemPrompt: null,
        citations: [],
        toolCalls: []
      }
    };
    const gateway = new FakeGateway();
    const useCase = new SubmitPromptUseCase(repository, gateway);
    const settings = createDefaultSettings();

    const appended: Message[][] = [];
    const updates: Message[] = [];

    await useCase.execute({
      prompt: "Hi",
      settings,
      onMessagesAppended: (messages) => appended.push(messages),
      onAssistantMessageUpdate: (message) => updates.push(message)
    });

    expect(appended).toHaveLength(1);
    expect(appended[0][0].role).toBe("user");
    expect(appended[0][1].role).toBe("assistant");
    expect(updates.at(-1)?.content).toBe("Hello world");
    expect(repository.conversation?.messages.at(-1)?.content).toBe("Hello world");
  });
});
