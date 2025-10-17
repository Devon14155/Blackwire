import type { ConversationRepository } from "@domain/repositories/ConversationRepository";
import type { Conversation } from "@domain/entities/Conversation";
import { createId } from "@core/utils/uuid";

export class GetOrCreateConversationUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(): Promise<Conversation> {
    const existing = await this.conversationRepository.getActiveConversation();
    if (existing) {
      return existing;
    }

    const now = Date.now();
    const conversation: Conversation = {
      id: createId(),
      title: "New conversation",
      messages: [],
      createdAt: now,
      updatedAt: now
    };

    await this.conversationRepository.saveConversation(conversation);
    return conversation;
  }
}
