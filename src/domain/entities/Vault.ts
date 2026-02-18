export type VaultStatus = "active" | "archived" | "completed";

export interface Vault {
  id: string;
  title: string;
  description: string;
  topic: string;
  status: VaultStatus;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  createdAt: number;
  updatedAt: number;
}

export interface VaultSnapshot extends Vault {}