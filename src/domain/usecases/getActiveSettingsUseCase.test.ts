import { describe, expect, it } from "vitest";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import type { ModelSettingsRepository } from "@domain/repositories/ModelSettingsRepository";
import { GetActiveSettingsUseCase } from "@domain/usecases/GetActiveSettingsUseCase";
import { SaveSettingsUseCase } from "@domain/usecases/SaveSettingsUseCase";
import { createDefaultSettings } from "@domain/config/defaultSettings";

class MemorySettingsRepository implements ModelSettingsRepository {
  private settings: ModelSettings | null = null;

  async getActiveSettings(): Promise<ModelSettings | null> {
    return this.settings ? { ...this.settings } : null;
  }

  async save(settings: ModelSettings): Promise<void> {
    this.settings = { ...settings };
  }
}

describe("Settings use cases", () => {
  it("returns defaults when no settings stored", async () => {
    const repository = new MemorySettingsRepository();
    const getSettings = new GetActiveSettingsUseCase(repository);
    const settings = await getSettings.execute();
    expect(settings.endpoint).toMatch(/^https:\/\//);
    expect(settings.id).toBeDefined();
  });

  it("persists updates", async () => {
    const repository = new MemorySettingsRepository();
    const saveSettings = new SaveSettingsUseCase(repository);
    const defaults = createDefaultSettings();
    await repository.save(defaults);

    await saveSettings.execute({ ...defaults, endpoint: "https://example.com" });
    const stored = await repository.getActiveSettings();
    expect(stored?.endpoint).toBe("https://example.com");
  });
});
