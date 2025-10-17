import type { ModelSettingsRepository } from "@domain/repositories/ModelSettingsRepository";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import { createDefaultSettings } from "@domain/config/defaultSettings";

export class GetActiveSettingsUseCase {
  constructor(private readonly repository: ModelSettingsRepository) {}

  async execute(): Promise<ModelSettings> {
    const existing = await this.repository.getActiveSettings();
    if (existing) {
      return existing;
    }

    const defaults = createDefaultSettings();
    await this.repository.save(defaults);
    return defaults;
  }
}
