const KEY_STORAGE = "nstar::storage-key";

const getCrypto = () =>
  typeof globalThis !== "undefined" && globalThis.crypto ? globalThis.crypto : undefined;

const subtle = getCrypto()?.subtle;

const bufferToBase64 = (buffer: ArrayBuffer) =>
  typeof Buffer !== "undefined"
    ? Buffer.from(buffer).toString("base64")
    : btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToBuffer = (value: string) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64");
  }
  const binary = atob(value);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return array.buffer;
};

const ensureKey = async (): Promise<CryptoKey | null> => {
  if (!subtle || typeof localStorage === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(KEY_STORAGE);
  if (stored) {
    const rawKey = base64ToBuffer(stored);
    return subtle.importKey("raw", rawKey, "AES-GCM", true, ["encrypt", "decrypt"]);
  }
  const key = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const exported = await subtle.exportKey("raw", key);
  localStorage.setItem(KEY_STORAGE, bufferToBase64(exported));
  return key;
};

export const StorageCipher = {
  async encrypt(plaintext: string): Promise<string> {
    if (!plaintext) {
      return plaintext;
    }
    const cryptoKey = await ensureKey();
    if (!cryptoKey || !subtle) {
      return plaintext;
    }
    const encoder = new TextEncoder();
    const iv = getCrypto()?.getRandomValues(new Uint8Array(12));
    if (!iv) {
      return plaintext;
    }
    const encrypted = await subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoder.encode(plaintext));
    const payload = {
      iv: bufferToBase64(iv.buffer),
      data: bufferToBase64(encrypted)
    };
    return JSON.stringify(payload);
  },
  async decrypt(payload: string): Promise<string> {
    if (!payload) {
      return payload;
    }
    try {
      const cryptoKey = await ensureKey();
      if (!cryptoKey || !subtle) {
        return payload;
      }
      const parsed = JSON.parse(payload);
      const iv = new Uint8Array(base64ToBuffer(parsed.iv));
      const data = base64ToBuffer(parsed.data);
      const decrypted = await subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, data);
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      return payload;
    }
  }
};
