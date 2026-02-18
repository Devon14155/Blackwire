export type AgentStatus = "idle" | "thinking" | "executing" | "waiting" | "error";

export interface AgentCapability {
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  avatar: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  config: AgentConfig;
  createdAt: number;
  updatedAt: number;
}

export interface AgentSnapshot extends Agent {}

export const DEFAULT_AGENTS: Omit<Agent, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Atlas",
    type: "planning",
    description: "Strategic planning and goal decomposition specialist",
    avatar: "🎯",
    status: "idle",
    capabilities: [
      { name: "goal_decomposition", description: "Break down complex goals", enabled: true },
      { name: "timeline_estimation", description: "Estimate project timelines", enabled: true },
      { name: "resource_allocation", description: "Allocate resources efficiently", enabled: true }
    ],
    config: {
      systemPrompt: "You are Atlas, a strategic planning specialist. Your role is to decompose complex goals into actionable subtasks, estimate timelines, and identify dependencies. Be thorough but practical.",
      temperature: 0.3,
      maxTokens: 4096,
      tools: ["create_task", "create_project", "get_project_status", "search_notes"]
    }
  },
  {
    name: "Nova",
    type: "executor",
    description: "Action execution and tool operation specialist",
    avatar: "⚡",
    status: "idle",
    capabilities: [
      { name: "tool_execution", description: "Execute tools safely", enabled: true },
      { name: "web_research", description: "Research and gather information", enabled: true },
      { name: "content_generation", description: "Generate various content types", enabled: true }
    ],
    config: {
      systemPrompt: "You are Nova, an execution specialist. Your role is to carry out specific actions using available tools. Focus on efficiency and accuracy. Report results clearly.",
      temperature: 0.5,
      maxTokens: 4096,
      tools: ["create_note", "create_flashcard", "search_web", "read_document", "summarize_content"]
    }
  },
  {
    name: "Echo",
    type: "reviewer",
    description: "Quality assurance and feedback specialist",
    avatar: "🔍",
    status: "idle",
    capabilities: [
      { name: "quality_review", description: "Review outputs for quality", enabled: true },
      { name: "feedback_generation", description: "Generate constructive feedback", enabled: true },
      { name: "iteration_planning", description: "Plan improvement iterations", enabled: true }
    ],
    config: {
      systemPrompt: "You are Echo, a quality assurance specialist. Your role is to review outputs, provide constructive feedback, and suggest improvements. Be thorough but supportive.",
      temperature: 0.4,
      maxTokens: 4096,
      tools: ["search_notes", "get_task_status", "compare_versions"]
    }
  },
  {
    name: "Sage",
    type: "general",
    description: "General-purpose assistant with broad capabilities",
    avatar: "🧠",
    status: "idle",
    capabilities: [
      { name: "conversation", description: "Natural conversation", enabled: true },
      { name: "knowledge_retrieval", description: "Retrieve relevant knowledge", enabled: true },
      { name: "cross_section_ops", description: "Operations across sections", enabled: true }
    ],
    config: {
      systemPrompt: "You are Sage, a general-purpose AI assistant. You help with a wide range of tasks and can leverage all platform capabilities. Be helpful, accurate, and concise.",
      temperature: 0.7,
      maxTokens: 4096,
      tools: ["search_all", "create_note", "create_task", "create_flashcard", "get_context"]
    }
  }
];