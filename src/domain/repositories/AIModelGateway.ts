import type { Message } from "@domain/entities/Message";
import type { ModelSettings } from "@domain/entities/ModelSettings";

export interface CompletionChunk {
  id: string;
  content: string;
  done: boolean;
}

export interface AIModelGateway {
  createCompletion(
    conversationId: string,
    messages: Message[],
    settings: ModelSettings,
    onChunk: (chunk: CompletionChunk) => void
  ): Promise<void>;
}
