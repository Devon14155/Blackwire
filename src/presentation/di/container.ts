import { ConversationRepositoryImpl } from "@data/repositories/ConversationRepositoryImpl";
import { ModelSettingsRepositoryImpl } from "@data/repositories/ModelSettingsRepositoryImpl";
import { NoteRepositoryImpl } from "@data/repositories/NoteRepositoryImpl";
import { CardRepositoryImpl } from "@data/repositories/CardRepositoryImpl";
import { WhiteboardRepositoryImpl } from "@data/repositories/WhiteboardRepositoryImpl";
import { VaultRepositoryImpl } from "@data/repositories/VaultRepositoryImpl";
import { LessonRepositoryImpl } from "@data/repositories/LessonRepositoryImpl";
import { FlashcardRepositoryImpl } from "@data/repositories/FlashcardRepositoryImpl";
import { DocumentRepositoryImpl } from "@data/repositories/DocumentRepositoryImpl";
import { ProjectRepositoryImpl } from "@data/repositories/ProjectRepositoryImpl";
import { TaskRepositoryImpl } from "@data/repositories/TaskRepositoryImpl";
import { EmbeddingRepositoryImpl } from "@data/repositories/EmbeddingRepositoryImpl";
import { AgentMemoryRepositoryImpl } from "@data/repositories/AgentMemoryRepositoryImpl";
import { WorkflowRepositoryImpl } from "@data/repositories/WorkflowRepositoryImpl";
import { HttpAIModelGateway } from "@data/gateways/HttpAIModelGateway";
import { GetOrCreateConversationUseCase } from "@domain/usecases/GetOrCreateConversationUseCase";
import { SubmitPromptUseCase } from "@domain/usecases/SubmitPromptUseCase";
import { ClearConversationUseCase } from "@domain/usecases/ClearConversationUseCase";
import { GetActiveSettingsUseCase } from "@domain/usecases/GetActiveSettingsUseCase";
import { SaveSettingsUseCase } from "@domain/usecases/SaveSettingsUseCase";
import { WorkflowEngine } from "@domain/services/WorkflowEngine";
import { horizonDB } from "@core/database/horizonDB";

const conversationRepository = new ConversationRepositoryImpl();
const modelSettingsRepository = new ModelSettingsRepositoryImpl();
const noteRepository = new NoteRepositoryImpl();
const cardRepository = new CardRepositoryImpl();
const whiteboardRepository = new WhiteboardRepositoryImpl();
const vaultRepository = new VaultRepositoryImpl();
const lessonRepository = new LessonRepositoryImpl();
const flashcardRepository = new FlashcardRepositoryImpl();
const documentRepository = new DocumentRepositoryImpl();
const projectRepository = new ProjectRepositoryImpl();
const taskRepository = new TaskRepositoryImpl();
const embeddingRepository = new EmbeddingRepositoryImpl();
const agentMemoryRepository = new AgentMemoryRepositoryImpl();
const workflowRepository = new WorkflowRepositoryImpl();
const aiModelGateway = new HttpAIModelGateway();
const workflowEngine = new WorkflowEngine();

export const container = {
  conversationRepository,
  modelSettingsRepository,
  noteRepository,
  cardRepository,
  whiteboardRepository,
  vaultRepository,
  lessonRepository,
  flashcardRepository,
  documentRepository,
  projectRepository,
  taskRepository,
  embeddingRepository,
  agentMemoryRepository,
  workflowRepository,
  aiModelGateway,
  workflowEngine,
  getConversation: new GetOrCreateConversationUseCase(conversationRepository),
  submitPrompt: new SubmitPromptUseCase(conversationRepository, aiModelGateway),
  clearConversation: new ClearConversationUseCase(conversationRepository),
  getSettings: new GetActiveSettingsUseCase(modelSettingsRepository),
  saveSettings: new SaveSettingsUseCase(modelSettingsRepository),
  db: horizonDB
};

export type AppContainer = typeof container;