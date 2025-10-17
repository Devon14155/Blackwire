import { createId } from "@core/utils/uuid";
import type { ModelSettings } from "@domain/entities/ModelSettings";

export const createDefaultSettings = (): ModelSettings => ({
  id: createId(),
  name: "OpenAI Compatible",
  preset: "openai",
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
  apiKey: "",
  apiKeyHeader: "Authorization",
  organization: "",
  temperature: 0.2,
  stream: true,
  httpMethod: "POST",
  customHeaders: {},
  createdAt: Date.now(),
  updatedAt: Date.now()
});
