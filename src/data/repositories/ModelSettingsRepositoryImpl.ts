import type { ModelSettingsRepository } from "@domain/repositories/ModelSettingsRepository";
import type { ModelSettings } from "@domain/entities/ModelSettings";
import { conversationDB } from "@core/database/conversationDB";
import { StorageCipher } from "@core/security/storageCipher";

export class ModelSettingsRepositoryImpl implements ModelSettingsRepository {
  async getActiveSettings(): Promise<ModelSettings | null> {
    const entity = await conversationDB.settings.orderBy("updatedAt").last();
    if (!entity) {
      return null;
    }

    const apiKey = entity.apiKey ? await StorageCipher.decrypt(entity.apiKey) : undefined;

    return {
      ...entity,
      apiKey,
      customHeaders: { ...entity.customHeaders }
    };
  }

  async save(settings: ModelSettings): Promise<void> {
    const apiKey = settings.apiKey ? await StorageCipher.encrypt(settings.apiKey) : settings.apiKey;
    await conversationDB.settings.put({
      ...settings,
      apiKey,
      customHeaders: { ...settings.customHeaders }
    });
  }
}
