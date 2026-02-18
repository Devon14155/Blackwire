export type WorkflowStatus = "pending" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type WorkflowType = "research_to_notes" | "meeting_to_tasks" | "document_to_whiteboard" | "lesson_to_flashcards" | "custom";

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  dependencies: string[];
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  context: Record<string, unknown>;
  result?: Record<string, unknown>;
  triggeredBy: "user" | "agent" | "schedule" | "event";
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface WorkflowSnapshot extends Workflow {}

export interface WorkflowTemplate {
  type: WorkflowType;
  name: string;
  description: string;
  steps: Omit<WorkflowStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    type: "research_to_notes",
    name: "Research to Notes",
    description: "Research a topic and create structured notes",
    steps: [
      { name: "Research Topic", type: "research", input: {}, dependencies: [] },
      { name: "Extract Key Points", type: "extract", input: {}, dependencies: ["Research Topic"] },
      { name: "Create Notes", type: "create_note", input: {}, dependencies: ["Extract Key Points"] },
      { name: "Generate Flashcards", type: "create_flashcards", input: {}, dependencies: ["Create Notes"] }
    ]
  },
  {
    type: "meeting_to_tasks",
    name: "Meeting to Tasks",
    description: "Process meeting notes and extract action items",
    steps: [
      { name: "Parse Meeting Notes", type: "parse", input: {}, dependencies: [] },
      { name: "Extract Action Items", type: "extract_actions", input: {}, dependencies: ["Parse Meeting Notes"] },
      { name: "Create Tasks", type: "create_tasks", input: {}, dependencies: ["Extract Action Items"] },
      { name: "Link to Project", type: "link_project", input: {}, dependencies: ["Create Tasks"] }
    ]
  },
  {
    type: "document_to_whiteboard",
    name: "Document to Whiteboard",
    description: "Extract concepts from document and create whiteboard cards",
    steps: [
      { name: "Read Document", type: "read_document", input: {}, dependencies: [] },
      { name: "Extract Concepts", type: "extract_concepts", input: {}, dependencies: ["Read Document"] },
      { name: "Create Whiteboard", type: "create_whiteboard", input: {}, dependencies: [] },
      { name: "Create Cards", type: "create_cards", input: {}, dependencies: ["Extract Concepts", "Create Whiteboard"] },
      { name: "Link Concepts", type: "link_cards", input: {}, dependencies: ["Create Cards"] }
    ]
  },
  {
    type: "lesson_to_flashcards",
    name: "Lesson to Flashcards",
    description: "Generate flashcards from lesson content",
    steps: [
      { name: "Analyze Lesson", type: "analyze_content", input: {}, dependencies: [] },
      { name: "Generate Questions", type: "generate_questions", input: {}, dependencies: ["Analyze Lesson"] },
      { name: "Create Flashcards", type: "create_flashcards", input: {}, dependencies: ["Generate Questions"] }
    ]
  }
];