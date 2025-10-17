import Dexie, { type Table } from "dexie";
import type { Conversation } from "@domain/entities/Conversation";
import type { ModelSettings } from "@domain/entities/ModelSettings";

export interface ConversationRecord extends Conversation {}
export interface SettingsRecord extends ModelSettings {}

class ConversationDatabase extends Dexie {
  conversations!: Table<ConversationRecord, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("nstar-chat-db");
    this.version(1).stores({
      conversations: "id, updatedAt",
      settings: "id, updatedAt"
    });
  }
}

export const conversationDB = new ConversationDatabase();
