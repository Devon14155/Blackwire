export type ModelPreset = "openai" | "azure" | "anthropic" | "ollama" | "openrouter" | "custom";

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface ModelSettings {
  id: string;
  name: string;
  preset: ModelPreset;
  endpoint: string;
  model: string;
  apiKey?: string;
  apiKeyHeader?: string;
  organization?: string;
  temperature: number;
  stream: boolean;
  httpMethod?: "POST" | "GET";
  customHeaders?: Record<string, string>;
  customBodyTemplate?: string;
  enableToolCalling: boolean;
  enableRAG: boolean;
  enableThinking: boolean;
  maxTokens: number;
  createdAt: number;
  updatedAt: number;
}

export interface ModelSettingsSnapshot extends ModelSettings {}
