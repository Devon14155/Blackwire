import type { Conversation } from "@domain/entities/Conversation";
import type { Message } from "@domain/entities/Message";

export interface ConversationRepository {
  getActiveConversation(): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  appendMessage(conversationId: string, message: Message): Promise<void>;
  updateMessage(conversationId: string, message: Message): Promise<void>;
  clear(conversationId: string): Promise<void>;
}
