import type { AIModelGateway } from "@domain/repositories/AIModelGateway";
import type { ConversationRepository } from "@domain/repositories/ConversationRepository";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import type { Message } from "@domain/entities/Message";
import { createId } from "@core/utils/uuid";

export interface SubmitPromptCallbacks {
  onMessagesAppended?: (messages: Message[]) => void;
  onAssistantMessageUpdate?: (message: Message) => void;
}

export interface SubmitPromptInput extends SubmitPromptCallbacks {
  prompt: string;
  settings: ModelSettings;
}

export class SubmitPromptUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly aiModelGateway: AIModelGateway
  ) {}

  async execute({ prompt, settings, onMessagesAppended, onAssistantMessageUpdate }: SubmitPromptInput): Promise<void> {
    if (!prompt.trim()) {
      return;
    }

    const callbacks: SubmitPromptCallbacks = {
      onMessagesAppended,
      onAssistantMessageUpdate
    };

    const conversation = (await this.conversationRepository.getActiveConversation()) ?? {
      id: createId(),
      title: "New conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!conversation.messages.length) {
      await this.conversationRepository.saveConversation(conversation);
    }

    const now = Date.now();
    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: prompt,
      createdAt: now
    };

    const assistantMessage: Message = {
      id: createId(),
      role: "assistant",
      content: "",
      createdAt: now,
      pending: true
    };

    await this.conversationRepository.appendMessage(conversation.id, userMessage);
    await this.conversationRepository.appendMessage(conversation.id, assistantMessage);

    callbacks.onMessagesAppended?.([userMessage, assistantMessage]);

    const accumulated: Message = { ...assistantMessage };

    try {
      await this.aiModelGateway.createCompletion(
        conversation.id,
        [...conversation.messages, userMessage],
        settings,
        async (chunk) => {
          accumulated.content += chunk.content;
          accumulated.pending = !chunk.done;
          accumulated.createdAt = Date.now();
          if (chunk.done) {
            delete accumulated.pending;
          }
          await this.conversationRepository.updateMessage(conversation.id, { ...accumulated });
          callbacks.onAssistantMessageUpdate?.({ ...accumulated });
        }
      );
    } catch (error) {
      accumulated.pending = false;
      accumulated.error = error instanceof Error ? error.message : String(error);
      await this.conversationRepository.updateMessage(conversation.id, { ...accumulated });
      callbacks.onAssistantMessageUpdate?.({ ...accumulated });
      throw error;
    }
  }
}
