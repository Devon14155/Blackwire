import type { AIModelGateway, CompletionChunk } from "@domain/repositories/AIModelGateway";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import type { Message } from "@domain/entities/Message";

interface RequestConfig {
  url: string;
  init: RequestInit;
  streamParser?: (
    line: string,
    onChunk: (chunk: CompletionChunk) => Promise<void> | void
  ) => Promise<boolean | void> | boolean | void;
  nonStreamHandler?: (
    payload: unknown,
    onChunk: (chunk: CompletionChunk) => Promise<void> | void
  ) => Promise<void> | void;
}

const mapMessages = (messages: Message[]) =>
  messages.map((message) => ({
    role: message.role,
    content: message.content
  }));

const parseJson = (input: string) => {
  try {
    return JSON.parse(input);
  } catch (error) {
    console.warn("Failed to parse JSON chunk", error);
    return null;
  }
};

export class HttpAIModelGateway implements AIModelGateway {
  async createCompletion(
    conversationId: string,
    messages: Message[],
    settings: ModelSettings,
    onChunk: (chunk: CompletionChunk) => void
  ): Promise<void> {
    const config = this.buildRequestConfig(conversationId, messages, settings);
    const response = await fetch(config.url, config.init);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upstream error (${response.status}): ${errorText}`);
    }

    if (settings.stream && config.streamParser && response.body) {
      await this.readStream(response.body, async (line) => {
        const result = await config.streamParser?.(line, onChunk);
        if (typeof result === "boolean") {
          return result;
        }
        return true;
      });
      await onChunk({ id: conversationId, content: "", done: true });
      return;
    }

    const json = await response.json().catch(async () => {
      const asText = await response.text();
      return parseJson(asText);
    });

    if (!json) {
      throw new Error("Unable to read response from upstream model");
    }

    if (config.nonStreamHandler) {
      await config.nonStreamHandler(json, onChunk);
    } else {
      const content = this.extractContent(settings.preset, json);
      await onChunk({ id: conversationId, content, done: true });
    }
  }

  private buildRequestConfig(
    conversationId: string,
    messages: Message[],
    settings: ModelSettings
  ): RequestConfig {
    const commonHeaders: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (settings.apiKey && settings.apiKeyHeader) {
      const headerValue = settings.apiKeyHeader.toLowerCase() === "authorization"
        ? `Bearer ${settings.apiKey}`
        : settings.apiKey;
      commonHeaders[settings.apiKeyHeader] = headerValue;
    }

    if (settings.organization) {
      commonHeaders["OpenAI-Organization"] = settings.organization;
    }

    const mergedHeaders = {
      ...commonHeaders,
      ...(settings.customHeaders ?? {})
    };

    switch (settings.preset) {
      case "openai":
        return {
          url: settings.endpoint,
          init: {
            method: settings.httpMethod ?? "POST",
            headers: mergedHeaders,
            body: JSON.stringify({
              model: settings.model,
              temperature: settings.temperature,
              stream: settings.stream,
              messages: mapMessages(messages)
            })
          },
          streamParser: (line, onChunk) => this.parseOpenAIStream(line, onChunk)
        };
      case "azure":
        return {
          url: settings.endpoint,
          init: {
            method: settings.httpMethod ?? "POST",
            headers: mergedHeaders,
            body: JSON.stringify({
              messages: mapMessages(messages),
              temperature: settings.temperature,
              stream: settings.stream
            })
          },
          streamParser: (line, onChunk) => this.parseOpenAIStream(line, onChunk)
        };
      case "anthropic": {
        const { system, nonSystem } = this.splitSystemMessage(messages);
        return {
          url: settings.endpoint,
          init: {
            method: settings.httpMethod ?? "POST",
            headers: {
              ...mergedHeaders,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: settings.model,
              temperature: settings.temperature,
              system,
              max_tokens: 4096,
              stream: settings.stream,
              messages: nonSystem.map((msg) => ({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: msg.content
              }))
            })
          },
          streamParser: (line, onChunk) => this.parseAnthropicStream(line, onChunk),
          nonStreamHandler: async (payload, onChunk) => {
            const content = this.extractContent("anthropic", payload);
            await onChunk({ id: conversationId, content, done: true });
          }
        };
      }
      case "ollama":
        return {
          url: settings.endpoint,
          init: {
            method: settings.httpMethod ?? "POST",
            headers: mergedHeaders,
            body: JSON.stringify({
              model: settings.model,
              stream: settings.stream,
              options: {
                temperature: settings.temperature
              },
              messages: mapMessages(messages)
            })
          },
          streamParser: (line, onChunk) => this.parseOllamaStream(line, onChunk)
        };
      case "custom":
      default:
        return this.buildCustomRequest(settings, messages);
    }
  }

  private splitSystemMessage(messages: Message[]) {
    const system = messages.find((message) => message.role === "system")?.content ?? "";
    const nonSystem = messages.filter((message) => message.role !== "system");
    return { system, nonSystem };
  }

  private async readStream(
    body: ReadableStream<Uint8Array>,
    onLine: (line: string) => boolean | void
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    let shouldContinue = true;

    while (shouldContinue) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n");
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary).trim();
        if (line) {
          const result = await onLine(line);
          if (result === false) {
            shouldContinue = false;
            break;
          }
        }
        buffer = buffer.slice(boundary + 1);
        boundary = buffer.indexOf("\n");
      }
    }
    if (!shouldContinue) {
      return;
    }
    const remainder = buffer.trim();
    if (remainder) {
      await onLine(remainder);
    }
  }

  private async parseOpenAIStream(
    line: string,
    onChunk: (chunk: CompletionChunk) => Promise<void> | void
  ): Promise<boolean> {
    if (!line.startsWith("data:")) {
      return true;
    }
    const payload = line.replace(/^data:\s*/, "").trim();
    if (payload === "[DONE]") {
      return false;
    }
    const json = parseJson(payload);
    if (!json) {
      return true;
    }
    const choices = json.choices ?? [];
    for (const choice of choices) {
      const content = choice.delta?.content ?? "";
      if (content) {
        await onChunk({ id: choice.id ?? choice.index ?? "chunk", content, done: false });
      }
    }
    return true;
  }

  private async parseAnthropicStream(
    line: string,
    onChunk: (chunk: CompletionChunk) => Promise<void> | void
  ): Promise<boolean> {
    if (!line.startsWith("data:")) {
      return true;
    }
    const payload = line.replace(/^data:\s*/, "").trim();
    if (!payload) {
      return true;
    }
    if (payload === "[DONE]" || payload === "event: message_stop") {
      return false;
    }
    const json = parseJson(payload);
    if (!json) {
      return true;
    }
    if (json.type === "content_block_delta" && json.delta?.text) {
      await onChunk({ id: json.id ?? "chunk", content: json.delta.text, done: false });
    }
    if (json.type === "message_delta" && json.delta?.stop_reason) {
      return false;
    }
    return true;
  }

  private async parseOllamaStream(
    line: string,
    onChunk: (chunk: CompletionChunk) => Promise<void> | void
  ): Promise<boolean> {
    const json = parseJson(line);
    if (!json) {
      return true;
    }
    if (json.done) {
      return false;
    }
    if (json.message?.content) {
      await onChunk({ id: json.id ?? "chunk", content: json.message.content, done: false });
    } else if (json.response) {
      await onChunk({ id: json.id ?? "chunk", content: json.response, done: false });
    }
    return true;
  }

  private buildCustomRequest(settings: ModelSettings, messages: Message[]): RequestConfig {
    const url = settings.endpoint;
    const headers = {
      "Content-Type": "application/json",
      ...(settings.customHeaders ?? {})
    } as Record<string, string>;

    if (settings.apiKey && settings.apiKeyHeader) {
      headers[settings.apiKeyHeader] = settings.apiKey;
    }

    const template = settings.customBodyTemplate ?? JSON.stringify({
      model: "{{model}}",
      messages: "{{messages}}",
      prompt: "{{prompt}}"
    });

    const body = template
      .replace(/\{\{model\}\}/g, settings.model)
      .replace(/\{\{prompt\}\}/g, messages[messages.length - 1]?.content ?? "")
      .replace(/\{\{messages\}\}/g, JSON.stringify(mapMessages(messages)));

    return {
      url,
      init: {
        method: settings.httpMethod ?? "POST",
        headers,
        body
      },
      nonStreamHandler: async (payload, onChunk) => {
        const content = this.extractContent("custom", payload);
        await onChunk({ id: "custom", content, done: true });
      }
    };
  }

  private extractContent(preset: ModelSettings["preset"], payload: any): string {
    switch (preset) {
      case "openai":
      case "azure": {
        const content = payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text;
        if (typeof content === "string") {
          return content;
        }
        if (Array.isArray(content)) {
          return content.map((c: any) => c?.text ?? "").join("");
        }
        return "";
      }
      case "anthropic": {
        const contentBlocks = payload.content ?? payload.output ?? [];
        if (Array.isArray(contentBlocks)) {
          return contentBlocks
            .map((block: any) => {
              if (typeof block === "string") {
                return block;
              }
              if (block?.text) {
                return block.text;
              }
              if (block?.content) {
                return block.content;
              }
              return "";
            })
            .join("");
        }
        if (payload?.content?.text) {
          return payload.content.text;
        }
        return "";
      }
      case "ollama":
        return payload.message?.content ?? payload.response ?? "";
      case "custom":
      default:
        if (typeof payload === "string") {
          return payload;
        }
        if (payload?.content) {
          return payload.content;
        }
        if (payload?.data) {
          return payload.data;
        }
        return JSON.stringify(payload);
    }
  }
}
