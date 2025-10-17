import type { ModelSettings } from "@domain/entities/ModelSettings";

export interface ModelSettingsRepository {
  getActiveSettings(): Promise<ModelSettings | null>;
  save(settings: ModelSettings): Promise<void>;
}
