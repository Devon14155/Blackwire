export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  embeddingId: string | null;
}

export interface NoteSnapshot extends Note {}