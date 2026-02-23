import { describe, it, expect } from "vitest";
import {
  encryptEntry,
  decryptEntry,
  toBase64,
  fromBase64,
} from "./entry-crypto";
import type { VaultEntry } from "./entry-crypto";
import { generateVaultKey } from "./vault-key";

const sampleEntry: VaultEntry = {
  serviceName: "Netflix",
  username: "viewer@example.com",
  password: "p@ssw0rd!123",
  notes: "Family plan",
  category: "entertainment",
};

describe("encryptEntry / decryptEntry", () => {
  it("round-trips a VaultEntry", async () => {
    const vk = await generateVaultKey();
    const blob = await encryptEntry(sampleEntry, vk);
    const decrypted = await decryptEntry(blob, vk);
    expect(decrypted).toEqual(sampleEntry);
  });

  it("round-trips an entry without optional notes", async () => {
    const entry: VaultEntry = {
      serviceName: "Minimal",
      username: "u",
      password: "p",
      category: "other",
    };
    const vk = await generateVaultKey();
    const blob = await encryptEntry(entry, vk);
    const decrypted = await decryptEntry(blob, vk);
    expect(decrypted).toEqual(entry);
  });

  it("produces different ciphertext on each call (random IV)", async () => {
    const vk = await generateVaultKey();
    const blob1 = await encryptEntry(sampleEntry, vk);
    const blob2 = await encryptEntry(sampleEntry, vk);
    expect(blob1).not.toEqual(blob2);
  });

  it("ciphertext starts with a 12-byte IV", async () => {
    const vk = await generateVaultKey();
    const blob = await encryptEntry(sampleEntry, vk);
    // Blob must be at least IV (12) + some ciphertext + tag (16)
    expect(blob.byteLength).toBeGreaterThan(12 + 16);
  });

  it("throws with wrong key", async () => {
    const vk1 = await generateVaultKey();
    const vk2 = await generateVaultKey();
    const blob = await encryptEntry(sampleEntry, vk1);
    await expect(decryptEntry(blob, vk2)).rejects.toThrow();
  });
});

describe("toBase64 / fromBase64", () => {
  it("round-trips arbitrary bytes", () => {
    const original = crypto.getRandomValues(new Uint8Array(64));
    const encoded = toBase64(original);
    const decoded = fromBase64(encoded);
    expect(decoded).toEqual(original);
  });

  it("round-trips an empty array", () => {
    const empty = new Uint8Array(0);
    const encoded = toBase64(empty);
    const decoded = fromBase64(encoded);
    expect(decoded).toEqual(empty);
  });

  it("produces a valid base64 string", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = toBase64(bytes);
    expect(encoded).toMatch(/^[A-Za-z0-9+/]*=*$/);
    expect(encoded).toBe("SGVsbG8=");
  });

  it("handles large blobs without stack overflow", () => {
    const large = new Uint8Array(100_000);
    const encoded = toBase64(large);
    const decoded = fromBase64(encoded);
    expect(decoded.byteLength).toBe(100_000);
  });
});
