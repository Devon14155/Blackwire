export type ModelPreset = "openai" | "azure" | "anthropic" | "ollama" | "custom";

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
  createdAt: number;
  updatedAt: number;
}

export interface ModelSettingsSnapshot extends ModelSettings {}
