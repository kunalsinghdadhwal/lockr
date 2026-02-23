import { describe, it, expect } from "vitest";
import { generateVaultKey, wrapVaultKey, unwrapVaultKey } from "./vault-key";
import { importMEKForWrapping } from "./kdf";
import { encryptEntry, decryptEntry } from "./entry-crypto";
import type { VaultEntry } from "./entry-crypto";

async function makeWrappingKey(
  seed: number = 0
): Promise<CryptoKey> {
  const bits = new Uint8Array(32).fill(seed);
  return importMEKForWrapping(bits);
}

describe("generateVaultKey", () => {
  it("returns an extractable AES-GCM CryptoKey", async () => {
    const vk = await generateVaultKey();
    expect(vk.type).toBe("secret");
    expect(vk.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(vk.extractable).toBe(true);
    expect(vk.usages).toContain("encrypt");
    expect(vk.usages).toContain("decrypt");
  });
});

describe("wrapVaultKey / unwrapVaultKey round-trip", () => {
  it("wraps and unwraps successfully", async () => {
    const vk = await generateVaultKey();
    const mek = await makeWrappingKey(1);

    const wrapped = await wrapVaultKey(vk, mek);
    expect(wrapped).toBeInstanceOf(Uint8Array);
    // AES-KW adds 8 bytes overhead to a 32-byte key
    expect(wrapped.byteLength).toBe(40);

    const unwrapped = await unwrapVaultKey(wrapped, mek);
    expect(unwrapped.type).toBe("secret");
    expect(unwrapped.algorithm).toMatchObject({ name: "AES-GCM" });
  });

  it("unwrapped key can encrypt and decrypt", async () => {
    const vk = await generateVaultKey();
    const mek = await makeWrappingKey(2);

    const wrapped = await wrapVaultKey(vk, mek);
    const unwrapped = await unwrapVaultKey(wrapped, mek);

    const entry: VaultEntry = {
      serviceName: "GitHub",
      username: "user@test.com",
      password: "s3cret!",
      category: "dev",
    };

    const blob = await encryptEntry(entry, unwrapped);
    const decrypted = await decryptEntry(blob, unwrapped);
    expect(decrypted).toEqual(entry);
  });

  it("throws with wrong wrapping key", async () => {
    const vk = await generateVaultKey();
    const correctKey = await makeWrappingKey(3);
    const wrongKey = await makeWrappingKey(4);

    const wrapped = await wrapVaultKey(vk, correctKey);

    await expect(unwrapVaultKey(wrapped, wrongKey)).rejects.toThrow();
  });
});
