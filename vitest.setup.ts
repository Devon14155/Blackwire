import "@testing-library/jest-dom";

if (typeof globalThis.crypto === "undefined") {
  const { webcrypto } = await import("node:crypto");
  // @ts-ignore - assign polyfill for tests
  globalThis.crypto = webcrypto as unknown as Crypto;
}
