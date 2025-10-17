import type { ConversationRepository } from "@domain/repositories/ConversationRepository";

export class ClearConversationUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(conversationId: string): Promise<void> {
    await this.conversationRepository.clear(conversationId);
  }
}
