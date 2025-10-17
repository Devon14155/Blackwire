import type { ModelSettingsRepository } from "@domain/repositories/ModelSettingsRepository";
import type { ModelSettings } from "@domain/entities/ModelSettings";

export class SaveSettingsUseCase {
  constructor(private readonly repository: ModelSettingsRepository) {}

  async execute(settings: ModelSettings): Promise<void> {
    const trimmedEndpoint = settings.endpoint.trim();
    if (!trimmedEndpoint) {
      throw new Error("Endpoint is required");
    }

    const sanitized: ModelSettings = {
      ...settings,
      endpoint: trimmedEndpoint,
      updatedAt: Date.now()
    };

    await this.repository.save(sanitized);
  }
}
