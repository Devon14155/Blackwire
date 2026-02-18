import type { VaultRepository } from "@domain/repositories/VaultRepository";
import type { Vault } from "@domain/entities/Vault";
import { horizonDB } from "@core/database/horizonDB";

export class VaultRepositoryImpl implements VaultRepository {
  async getById(id: string): Promise<Vault | null> {
    const vault = await horizonDB.vaults.get(id);
    return vault || null;
  }

  async getAll(): Promise<Vault[]> {
    return horizonDB.vaults.toArray();
  }

  async getActive(): Promise<Vault[]> {
    return horizonDB.vaults.where("status").equals("active").toArray();
  }

  async save(vault: Vault): Promise<void> {
    await horizonDB.vaults.put({ ...vault, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await horizonDB.vaults.delete(id);
  }

  async updateProgress(id: string): Promise<void> {
    const vault = await horizonDB.vaults.get(id);
    if (!vault) return;

    const lessons = await horizonDB.lessons.where("vaultId").equals(id).toArray();
    const completed = lessons.filter(l => l.status === "completed").length;
    const total = lessons.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await horizonDB.vaults.update(id, {
      progress,
      completedLessons: completed,
      totalLessons: total,
      updatedAt: Date.now()
    });
  }
}