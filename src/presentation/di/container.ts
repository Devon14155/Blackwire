import { ConversationRepositoryImpl } from "@data/repositories/ConversationRepositoryImpl";
import { ModelSettingsRepositoryImpl } from "@data/repositories/ModelSettingsRepositoryImpl";
import { HttpAIModelGateway } from "@data/gateways/HttpAIModelGateway";
import { GetOrCreateConversationUseCase } from "@domain/usecases/GetOrCreateConversationUseCase";
import { SubmitPromptUseCase } from "@domain/usecases/SubmitPromptUseCase";
import { ClearConversationUseCase } from "@domain/usecases/ClearConversationUseCase";
import { GetActiveSettingsUseCase } from "@domain/usecases/GetActiveSettingsUseCase";
import { SaveSettingsUseCase } from "@domain/usecases/SaveSettingsUseCase";

const conversationRepository = new ConversationRepositoryImpl();
const modelSettingsRepository = new ModelSettingsRepositoryImpl();
const aiModelGateway = new HttpAIModelGateway();

export const container = {
  conversationRepository,
  modelSettingsRepository,
  aiModelGateway,
  getConversation: new GetOrCreateConversationUseCase(conversationRepository),
  submitPrompt: new SubmitPromptUseCase(conversationRepository, aiModelGateway),
  clearConversation: new ClearConversationUseCase(conversationRepository),
  getSettings: new GetActiveSettingsUseCase(modelSettingsRepository),
  saveSettings: new SaveSettingsUseCase(modelSettingsRepository)
};

export type AppContainer = typeof container;
