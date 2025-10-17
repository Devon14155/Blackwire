import { create } from "zustand";
import type { Conversation } from "@domain/entities/Conversation";
import type { Message } from "@domain/entities/Message";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import type { AppContainer } from "@presentation/di/container";
import { container } from "@presentation/di/container";

interface ChatState {
  conversation: Conversation | null;
  messages: Message[];
  settings: ModelSettings | null;
  loading: boolean;
  error?: string;
  initialize: () => Promise<void>;
  sendMessage: (prompt: string) => Promise<void>;
  clearConversation: () => Promise<void>;
  updateSettings: (settings: Partial<ModelSettings>) => void;
  persistSettings: () => Promise<void>;
}

export const createChatStore = (deps: AppContainer) =>
  create<ChatState>((set, get) => ({
    conversation: null,
    messages: [],
    settings: null,
    loading: false,
    error: undefined,
    initialize: async () => {
      set({ loading: true, error: undefined });
      try {
        const [conversation, settings] = await Promise.all([
          deps.getConversation.execute(),
          deps.getSettings.execute()
        ]);
        set({
          conversation,
          messages: conversation.messages,
          settings,
          loading: false
        });
      } catch (error) {
        set({ loading: false, error: error instanceof Error ? error.message : String(error) });
      }
    },
    sendMessage: async (prompt: string) => {
      const { settings } = get();
      if (!settings) {
        throw new Error("Model settings not loaded");
      }
      set({ loading: true, error: undefined });
      try {
        const conversation = await deps.getConversation.execute();
        set({ conversation, messages: conversation.messages });
        await deps.submitPrompt.execute({
          prompt,
          settings,
          onMessagesAppended: (messages) => {
            set((state) => {
              const updatedMessages = [...state.messages, ...messages];
              return {
                messages: updatedMessages,
                conversation: state.conversation
                  ? { ...state.conversation, messages: updatedMessages }
                  : state.conversation
              };
            });
          },
          onAssistantMessageUpdate: (message) => {
            set((state) => {
              const messages = state.messages.map((item) =>
                item.id === message.id ? { ...item, ...message } : item
              );
              return {
                messages,
                conversation: state.conversation
                  ? { ...state.conversation, messages }
                  : state.conversation
              };
            });
          }
        });
        set({ loading: false });
      } catch (error) {
        set({ loading: false, error: error instanceof Error ? error.message : String(error) });
      }
    },
    clearConversation: async () => {
      const conversation = get().conversation;
      if (!conversation) {
        return;
      }
      await deps.clearConversation.execute(conversation.id);
      set({
        conversation: { ...conversation, messages: [] },
        messages: []
      });
    },
    updateSettings: (partial) => {
      set((state) => {
        if (!state.settings) {
          return state;
        }
        const merged: ModelSettings = {
          ...state.settings,
          ...partial,
          customHeaders: {
            ...state.settings.customHeaders,
            ...(partial.customHeaders ?? {})
          }
        };
        return { settings: merged };
      });
    },
    persistSettings: async () => {
      const settings = get().settings;
      if (!settings) {
        return;
      }
      try {
        await deps.saveSettings.execute(settings);
        set({ error: undefined });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }
  }));

export const chatStore = createChatStore(container);
export const useChatStore = chatStore;
