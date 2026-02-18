import { createId } from "@core/utils/uuid";
import type { ModelSettings } from "@domain/entities/ModelSettings";

export const createDefaultSettings = (): ModelSettings => ({
  id: createId(),
  name: "OpenRouter (Default)",
  preset: "openrouter",
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  model: "anthropic/claude-3-haiku",
  apiKey: "",
  apiKeyHeader: "Authorization",
  organization: "",
  temperature: 0.7,
  stream: true,
  httpMethod: "POST",
  customHeaders: {
    "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://horizon.local",
    "X-Title": "Horizon PWA"
  },
  enableToolCalling: true,
  enableRAG: true,
  enableThinking: true,
  maxTokens: 4096,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const createOpenAISettings = (): ModelSettings => ({
  id: createId(),
  name: "OpenAI GPT-4o-mini",
  preset: "openai",
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
  apiKey: "",
  apiKeyHeader: "Authorization",
  organization: "",
  temperature: 0.7,
  stream: true,
  httpMethod: "POST",
  customHeaders: {},
  enableToolCalling: true,
  enableRAG: true,
  enableThinking: false,
  maxTokens: 4096,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const createAnthropicSettings = (): ModelSettings => ({
  id: createId(),
  name: "Anthropic Claude",
  preset: "anthropic",
  endpoint: "https://api.anthropic.com/v1/messages",
  model: "claude-3-haiku-20240307",
  apiKey: "",
  apiKeyHeader: "x-api-key",
  organization: "",
  temperature: 0.7,
  stream: true,
  httpMethod: "POST",
  customHeaders: {
    "anthropic-version": "2023-06-01"
  },
  enableToolCalling: true,
  enableRAG: true,
  enableThinking: true,
  maxTokens: 4096,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const createOllamaSettings = (): ModelSettings => ({
  id: createId(),
  name: "Ollama Local",
  preset: "ollama",
  endpoint: "http://127.0.0.1:11434/api/chat",
  model: "llama3",
  apiKey: "",
  apiKeyHeader: "",
  organization: "",
  temperature: 0.7,
  stream: true,
  httpMethod: "POST",
  customHeaders: {},
  enableToolCalling: false,
  enableRAG: true,
  enableThinking: false,
  maxTokens: 4096,
  createdAt: Date.now(),
  updatedAt: Date.now()
});
