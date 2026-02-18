import type { ToolDefinition, ToolResult } from "@domain/entities/Tool";
import { horizonDB } from "@core/database/horizonDB";
import { createId } from "@core/utils/uuid";
import { VectorSearchService } from "@core/embeddings/VectorSearchService";
import { RAGService } from "@domain/services/RAGService";

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

class ToolRegistryClass {
  private tools: Map<string, RegisteredTool> = new Map();

  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  getAll(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  getDefinitions(): ToolDefinition[] {
    return this.getAll().map(t => t.definition);
  }

  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`
      };
    }

    const validation = this.validateArgs(tool.definition, args);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    try {
      return await tool.handler(args);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private validateArgs(
    definition: ToolDefinition,
    args: Record<string, unknown>
  ): { valid: boolean; error?: string } {
    for (const param of definition.parameters) {
      if (param.required && !(param.name in args)) {
        return {
          valid: false,
          error: `Missing required parameter: ${param.name}`
        };
      }

      if (param.name in args && param.enum) {
        const value = args[param.name];
        if (!param.enum.includes(String(value))) {
          return {
            valid: false,
            error: `Invalid value for ${param.name}. Must be one of: ${param.enum.join(", ")}`
          };
        }
      }
    }

    return { valid: true };
  }
}

export const ToolRegistry = new ToolRegistryClass();

ToolRegistry.register(
  {
    name: "create_note",
    description: "Create a new note in the knowledge base",
    parameters: [
      { name: "title", type: "string", description: "Note title", required: true },
      { name: "content", type: "string", description: "Note content", required: false, default: "" },
      { name: "tags", type: "array", description: "Tags for organization", required: false, default: [] },
      { name: "parentId", type: "string", description: "Parent note ID for nesting", required: false }
    ],
    returns: { type: "object", description: "Created note with ID" }
  },
  async (args) => {
    const id = createId();
    const now = Date.now();

    const note = {
      id,
      title: String(args.title),
      content: String(args.content || ""),
      tags: Array.isArray(args.tags) ? args.tags as string[] : [],
      parentId: args.parentId ? String(args.parentId) : null,
      createdAt: now,
      updatedAt: now,
      embeddingId: null
    };

    await horizonDB.notes.add(note);

    if (note.content) {
      await RAGService.indexNote(id);
    }

    return { success: true, data: { noteId: id, title: note.title } };
  }
);

ToolRegistry.register(
  {
    name: "create_task",
    description: "Create a new task",
    parameters: [
      { name: "title", type: "string", description: "Task title", required: true },
      { name: "description", type: "string", description: "Task description", required: false, default: "" },
      { name: "projectId", type: "string", description: "Project ID to link to", required: false },
      { name: "priority", type: "string", description: "Task priority", required: false, enum: ["low", "medium", "high", "urgent"], default: "medium" },
      { name: "dueDate", type: "string", description: "Due date ISO string", required: false }
    ],
    returns: { type: "object", description: "Created task with ID" }
  },
  async (args) => {
    const id = createId();
    const now = Date.now();

    const task = {
      id,
      projectId: args.projectId ? String(args.projectId) : null,
      title: String(args.title),
      description: String(args.description || ""),
      status: "todo" as const,
      priority: (args.priority || "medium") as "low" | "medium" | "high" | "urgent",
      dueDate: args.dueDate ? new Date(String(args.dueDate)).getTime() : null,
      completedAt: null,
      estimatedMinutes: null,
      actualMinutes: null,
      dependencies: [],
      labels: [],
      embeddingId: null,
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.tasks.add(task);

    return { success: true, data: { taskId: id, title: task.title } };
  }
);

ToolRegistry.register(
  {
    name: "create_flashcards",
    description: "Generate flashcards from content or topic",
    parameters: [
      { name: "topic", type: "string", description: "Topic to generate flashcards for", required: true },
      { name: "count", type: "number", description: "Number of flashcards to generate", required: false, default: 5 },
      { name: "lessonId", type: "string", description: "Lesson ID to link to", required: false }
    ],
    returns: { type: "object", description: "Created flashcard IDs" }
  },
  async (args) => {
    const topic = String(args.topic);
    const count = Math.min(Number(args.count) || 5, 10);
    const lessonId = args.lessonId ? String(args.lessonId) : null;

    const flashcards: Array<{ id: string; front: string; back: string }> = [];
    const now = Date.now();

    const sampleCards = [
      { front: `What is ${topic}?`, back: `${topic} is a concept that requires further exploration.` },
      { front: `Key principles of ${topic}`, back: "1. Foundational concepts\n2. Core mechanisms\n3. Applications" },
      { front: `How does ${topic} work?`, back: `${topic} operates through a series of interconnected processes.` },
      { front: `Benefits of ${topic}`, back: "- Improved understanding\n- Better efficiency\n- Enhanced outcomes" },
      { front: `Common use cases for ${topic}`, back: "1. Research\n2. Development\n3. Implementation" }
    ];

    for (let i = 0; i < count; i++) {
      const card = sampleCards[i % sampleCards.length];
      const id = createId();

      await horizonDB.flashcards.add({
        id,
        lessonId,
        front: card.front,
        back: card.back,
        nextReview: now,
        interval: 1,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        createdAt: now,
        updatedAt: now
      });

      flashcards.push({ id, front: card.front, back: card.back });
    }

    return {
      success: true,
      data: {
        count: flashcards.length,
        flashcards: flashcards.map(f => ({ id: f.id, front: f.front }))
      }
    };
  }
);

ToolRegistry.register(
  {
    name: "search_notes",
    description: "Search notes in the knowledge base",
    parameters: [
      { name: "query", type: "string", description: "Search query", required: true },
      { name: "limit", type: "number", description: "Maximum results", required: false, default: 10 }
    ],
    returns: { type: "array", description: "Matching notes" }
  },
  async (args) => {
    const query = String(args.query);
    const limit = Number(args.limit) || 10;

    const results = await VectorSearchService.searchWithContent(query, {
      sourceTypes: ["note"],
      limit
    });

    return {
      success: true,
      data: results.map(r => ({
        id: r.sourceId,
        title: r.title,
        snippet: r.content?.slice(0, 200),
        relevance: Math.round(r.similarity * 100)
      }))
    };
  }
);

ToolRegistry.register(
  {
    name: "search_all",
    description: "Search across all content types",
    parameters: [
      { name: "query", type: "string", description: "Search query", required: true },
      { name: "limit", type: "number", description: "Maximum results", required: false, default: 10 }
    ],
    returns: { type: "array", description: "Matching content from all sources" }
  },
  async (args) => {
    const query = String(args.query);
    const limit = Number(args.limit) || 10;

    const results = await VectorSearchService.searchWithContent(query, { limit });

    return {
      success: true,
      data: results.map(r => ({
        type: r.sourceType,
        id: r.sourceId,
        title: r.title,
        snippet: r.content?.slice(0, 200),
        relevance: Math.round(r.similarity * 100)
      }))
    };
  }
);

ToolRegistry.register(
  {
    name: "get_project_status",
    description: "Get status of a project",
    parameters: [
      { name: "projectId", type: "string", description: "Project ID", required: true }
    ],
    returns: { type: "object", description: "Project status and progress" }
  },
  async (args) => {
    const projectId = String(args.projectId);
    const project = await horizonDB.projects.get(projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const tasks = await horizonDB.tasks.where("projectId").equals(projectId).toArray();
    const completed = tasks.filter(t => t.status === "done").length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      success: true,
      data: {
        title: project.title,
        status: project.status,
        progress,
        totalTasks: total,
        completedTasks: completed
      }
    };
  }
);

ToolRegistry.register(
  {
    name: "read_document",
    description: "Read and extract content from a document",
    parameters: [
      { name: "documentId", type: "string", description: "Document ID", required: true }
    ],
    returns: { type: "object", description: "Document content and metadata" }
  },
  async (args) => {
    const documentId = String(args.documentId);
    const doc = await horizonDB.documents.get(documentId);

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    return {
      success: true,
      data: {
        filename: doc.filename,
        content: doc.content.slice(0, 5000),
        summary: doc.summary,
        tags: doc.tags
      }
    };
  }
);

ToolRegistry.register(
  {
    name: "summarize_content",
    description: "Generate a summary of content",
    parameters: [
      { name: "content", type: "string", description: "Content to summarize", required: false },
      { name: "topic", type: "string", description: "Topic to search and summarize", required: false }
    ],
    returns: { type: "string", description: "Summary of content" }
  },
  async (args) => {
    let content = String(args.content || "");

    if (!content && args.topic) {
      const results = await VectorSearchService.searchWithContent(String(args.topic), { limit: 3 });
      content = results.map(r => r.content || "").join("\n\n");
    }

    if (!content) {
      return { success: false, error: "No content provided" };
    }

    const summary = content.length > 500
      ? content.slice(0, 500) + "..."
      : content;

    return {
      success: true,
      data: {
        summary,
        wordCount: content.split(/\s+/).length
      }
    };
  }
);

ToolRegistry.register(
  {
    name: "get_context",
    description: "Retrieve relevant context for a query",
    parameters: [
      { name: "query", type: "string", description: "Query for context retrieval", required: true },
      { name: "maxSources", type: "number", description: "Maximum sources to retrieve", required: false, default: 5 }
    ],
    returns: { type: "object", description: "Retrieved context with sources" }
  },
  async (args) => {
    const query = String(args.query);
    const maxSources = Number(args.maxSources) || 5;

    const context = await RAGService.retrieveContext(query, { maxSources });

    return {
      success: true,
      data: {
        formattedContext: context.formattedContext,
        sources: context.sources.map(s => ({
          type: s.sourceType,
          id: s.sourceId,
          title: s.title,
          relevance: Math.round(s.relevance * 100)
        })),
        tokenCount: context.totalTokens
      }
    };
  }
);

ToolRegistry.register(
  {
    name: "create_whiteboard",
    description: "Create a new whiteboard",
    parameters: [
      { name: "title", type: "string", description: "Whiteboard title", required: true },
      { name: "description", type: "string", description: "Whiteboard description", required: false, default: "" }
    ],
    returns: { type: "object", description: "Created whiteboard with ID" }
  },
  async (args) => {
    const id = createId();
    const now = Date.now();

    const whiteboard = {
      id,
      title: String(args.title),
      description: String(args.description || ""),
      parentId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.whiteboards.add(whiteboard);

    return { success: true, data: { whiteboardId: id, title: whiteboard.title } };
  }
);

ToolRegistry.register(
  {
    name: "save_to_knowledge",
    description: "Save content to the knowledge base",
    parameters: [
      { name: "content", type: "string", description: "Content to save", required: true },
      { name: "title", type: "string", description: "Title for the note", required: false },
      { name: "tags", type: "array", description: "Tags for organization", required: false, default: [] }
    ],
    returns: { type: "object", description: "Created note ID" }
  },
  async (args) => {
    const content = String(args.content);
    const title = String(args.title || "Saved content");
    const tags = Array.isArray(args.tags) ? args.tags as string[] : [];

    const id = createId();
    const now = Date.now();

    const note = {
      id,
      title,
      content,
      tags,
      parentId: null,
      createdAt: now,
      updatedAt: now,
      embeddingId: null
    };

    await horizonDB.notes.add(note);
    await RAGService.indexNote(id);

    return { success: true, data: { noteId: id, title } };
  }
);