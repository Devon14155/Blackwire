import type { Vault } from "@domain/entities/Vault";

export interface VaultRepository {
  getById(id: string): Promise<Vault | null>;
  getAll(): Promise<Vault[]>;
  getActive(): Promise<Vault[]>;
  save(vault: Vault): Promise<void>;
  delete(id: string): Promise<void>;
  updateProgress(id: string): Promise<void>;
}