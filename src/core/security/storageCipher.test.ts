import { beforeEach, describe, expect, it } from "vitest";
import { StorageCipher } from "@core/security/storageCipher";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  // vite jsdom environment allows this
  (globalThis as any).localStorage = new MemoryStorage();
});

describe("StorageCipher", () => {
  it("encrypts and decrypts data deterministically", async () => {
    const encrypted = await StorageCipher.encrypt("secret-value");
    expect(encrypted).not.toBe("secret-value");

    const decrypted = await StorageCipher.decrypt(encrypted);
    expect(decrypted).toBe("secret-value");
  });

  it("returns original value when crypto is unavailable", async () => {
    const originalCrypto = globalThis.crypto;
    (globalThis as any).crypto = undefined;
    const plain = await StorageCipher.encrypt("plaintext");
    expect(plain).toBe("plaintext");
    (globalThis as any).crypto = originalCrypto;
  });
});
