import type { ModelSettingsRepository } from "@domain/repositories/ModelSettingsRepository";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import { horizonDB } from "@core/database/horizonDB";
import { StorageCipher } from "@core/security/storageCipher";

export class ModelSettingsRepositoryImpl implements ModelSettingsRepository {
  async getActiveSettings(): Promise<ModelSettings | null> {
    const entity = await horizonDB.settings.orderBy("updatedAt").last();
    if (!entity) {
      return null;
    }

    const apiKey = entity.apiKey ? await StorageCipher.decrypt(entity.apiKey) : undefined;

    return {
      ...entity,
      apiKey,
      customHeaders: { ...entity.customHeaders },
      enableToolCalling: entity.enableToolCalling ?? false,
      enableRAG: entity.enableRAG ?? false,
      enableThinking: entity.enableThinking ?? false,
      maxTokens: entity.maxTokens ?? 4096
    };
  }

  async save(settings: ModelSettings): Promise<void> {
    const apiKey = settings.apiKey ? await StorageCipher.encrypt(settings.apiKey) : settings.apiKey;
    await horizonDB.settings.put({
      ...settings,
      apiKey,
      customHeaders: { ...settings.customHeaders }
    });
  }
}
