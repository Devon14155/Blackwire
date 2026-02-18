import type { ConversationRepository } from "@domain/repositories/ConversationRepository";
import type { Conversation } from "@domain/entities/Conversation";
import type { Message } from "@domain/entities/Message";
import { horizonDB } from "@core/database/horizonDB";

const DEFAULT_CONTEXT: Conversation["context"] = {
  ragEnabled: false,
  activeAgentId: null,
  systemPrompt: null,
  citations: [],
  toolCalls: []
};

export class ConversationRepositoryImpl implements ConversationRepository {
  private toConversation(record: Conversation | undefined | null): Conversation | null {
    if (!record) {
      return null;
    }
    return {
      ...record,
      messages: [...record.messages],
      context: record.context || DEFAULT_CONTEXT
    };
  }

  async getActiveConversation(): Promise<Conversation | null> {
    const record = await horizonDB.conversations.orderBy("updatedAt").last();
    return this.toConversation(record ?? null);
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await horizonDB.conversations.put({
      ...conversation,
      messages: [...conversation.messages],
      context: conversation.context || DEFAULT_CONTEXT
    });
  }

  async appendMessage(conversationId: string, message: Message): Promise<void> {
    await horizonDB.transaction("rw", horizonDB.conversations, async () => {
      const record = await horizonDB.conversations.get(conversationId);
      if (!record) {
        throw new Error("Conversation not found");
      }
      const updated: Conversation = {
        ...record,
        messages: [...record.messages, message],
        context: record.context || DEFAULT_CONTEXT,
        updatedAt: Date.now()
      };
      await horizonDB.conversations.put(updated);
    });
  }

  async updateMessage(conversationId: string, message: Message): Promise<void> {
    await horizonDB.transaction("rw", horizonDB.conversations, async () => {
      const record = await horizonDB.conversations.get(conversationId);
      if (!record) {
        throw new Error("Conversation not found");
      }
      const index = record.messages.findIndex((m) => m.id === message.id);
      if (index === -1) {
        return;
      }
      const updatedMessages = [...record.messages];
      updatedMessages[index] = { ...record.messages[index], ...message };
      const updated: Conversation = {
        ...record,
        messages: updatedMessages,
        context: record.context || DEFAULT_CONTEXT,
        updatedAt: Date.now()
      };
      await horizonDB.conversations.put(updated);
    });
  }

  async clear(conversationId: string): Promise<void> {
    await horizonDB.transaction("rw", horizonDB.conversations, async () => {
      const record = await horizonDB.conversations.get(conversationId);
      if (!record) {
        return;
      }
      const cleared: Conversation = {
        ...record,
        messages: [],
        context: DEFAULT_CONTEXT,
        updatedAt: Date.now()
      };
      await horizonDB.conversations.put(cleared);
    });
  }
}
