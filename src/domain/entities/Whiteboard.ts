export interface WhiteboardViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Whiteboard {
  id: string;
  title: string;
  description: string;
  parentId: string | null;
  viewport: WhiteboardViewport;
  createdAt: number;
  updatedAt: number;
}

export interface WhiteboardSnapshot extends Whiteboard {}