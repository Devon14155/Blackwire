import type { Whiteboard } from "@domain/entities/Whiteboard";

export interface WhiteboardRepository {
  getById(id: string): Promise<Whiteboard | null>;
  getAll(): Promise<Whiteboard[]>;
  getByParentId(parentId: string | null): Promise<Whiteboard[]>;
  save(whiteboard: Whiteboard): Promise<void>;
  delete(id: string): Promise<void>;
}