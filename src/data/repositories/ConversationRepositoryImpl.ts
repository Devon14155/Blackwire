import type { ConversationRepository } from "@domain/repositories/ConversationRepository";
import type { Conversation } from "@domain/entities/Conversation";
import type { Message } from "@domain/entities/Message";
import { conversationDB } from "@core/database/conversationDB";

export class ConversationRepositoryImpl implements ConversationRepository {
  private toConversation(record: Conversation | undefined | null): Conversation | null {
    if (!record) {
      return null;
    }
    return {
      ...record,
      messages: [...record.messages]
    };
  }

  async getActiveConversation(): Promise<Conversation | null> {
    const record = await conversationDB.conversations.orderBy("updatedAt").last();
    return this.toConversation(record ?? null);
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await conversationDB.conversations.put({ ...conversation, messages: [...conversation.messages] });
  }

  async appendMessage(conversationId: string, message: Message): Promise<void> {
    await conversationDB.transaction("rw", conversationDB.conversations, async () => {
      const record = await conversationDB.conversations.get(conversationId);
      if (!record) {
        throw new Error("Conversation not found");
      }
      const updated: Conversation = {
        ...record,
        messages: [...record.messages, message],
        updatedAt: Date.now()
      };
      await conversationDB.conversations.put(updated);
    });
  }

  async updateMessage(conversationId: string, message: Message): Promise<void> {
    await conversationDB.transaction("rw", conversationDB.conversations, async () => {
      const record = await conversationDB.conversations.get(conversationId);
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
        updatedAt: Date.now()
      };
      await conversationDB.conversations.put(updated);
    });
  }

  async clear(conversationId: string): Promise<void> {
    await conversationDB.transaction("rw", conversationDB.conversations, async () => {
      const record = await conversationDB.conversations.get(conversationId);
      if (!record) {
        return;
      }
      const cleared: Conversation = {
        ...record,
        messages: [],
        updatedAt: Date.now()
      };
      await conversationDB.conversations.put(cleared);
    });
  }
}
