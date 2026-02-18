export interface DocumentMetadata {
  author?: string;
  created?: string;
  modified?: string;
  source?: string;
  [key: string]: unknown;
}

export interface Document {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  content: string;
  summary: string;
  tags: string[];
  metadata: DocumentMetadata;
  createdAt: number;
  updatedAt: number;
  embeddingId: string | null;
}

export interface DocumentSnapshot extends Document {}

export const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/html",
  "application/json",
  "text/csv"
] as const;