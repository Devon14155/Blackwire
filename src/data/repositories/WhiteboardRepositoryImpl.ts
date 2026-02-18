import type { WhiteboardRepository } from "@domain/repositories/WhiteboardRepository";
import type { Whiteboard } from "@domain/entities/Whiteboard";
import { horizonDB } from "@core/database/horizonDB";

export class WhiteboardRepositoryImpl implements WhiteboardRepository {
  async getById(id: string): Promise<Whiteboard | null> {
    const whiteboard = await horizonDB.whiteboards.get(id);
    return whiteboard || null;
  }

  async getAll(): Promise<Whiteboard[]> {
    return horizonDB.whiteboards.toArray();
  }

  async getByParentId(parentId: string | null): Promise<Whiteboard[]> {
    if (parentId === null) {
      return horizonDB.whiteboards.where("parentId").equals(null as unknown as string).toArray();
    }
    return horizonDB.whiteboards.where("parentId").equals(parentId).toArray();
  }

  async save(whiteboard: Whiteboard): Promise<void> {
    await horizonDB.whiteboards.put({ ...whiteboard, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.whiteboards.delete(id);
  }
}