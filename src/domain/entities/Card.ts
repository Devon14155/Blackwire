export interface CardPosition {
  x: number;
  y: number;
}

export interface CardSize {
  width: number;
  height: number;
}

export interface CardLink {
  targetId: string;
  label?: string;
}

export interface Card {
  id: string;
  content: string;
  whiteboardId: string;
  position: CardPosition;
  size: CardSize;
  color: string;
  links: CardLink[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  embeddingId: string | null;
}

export interface CardSnapshot extends Card {}