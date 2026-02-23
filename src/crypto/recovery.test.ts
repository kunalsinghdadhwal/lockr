import { describe, it, expect } from "vitest";
import {
  generateRecoveryKey,
  wrapVKWithRecoveryKey,
  unwrapVKWithRecoveryKey,
} from "./recovery";
import { generateVaultKey } from "./vault-key";
import { encryptEntry, decryptEntry } from "./entry-crypto";
import type { VaultEntry } from "./entry-crypto";

describe("generateRecoveryKey", () => {
  it("returns a display string and a wrapping key", async () => {
    const { recoveryKeyDisplay, recoveryWrappingKey } =
      await generateRecoveryKey();
    expect(typeof recoveryKeyDisplay).toBe("string");
    expect(recoveryKeyDisplay.length).toBeGreaterThan(0);
    // Should be dash-separated groups
    expect(recoveryKeyDisplay).toContain("-");
    expect(recoveryWrappingKey.type).toBe("secret");
  });

  it("display string contains only base58 characters and dashes", async () => {
    const { recoveryKeyDisplay } = await generateRecoveryKey();
    const cleaned = recoveryKeyDisplay.replace(/-/g, "");
    // Base58 alphabet: no 0, O, I, l
    expect(cleaned).toMatch(
      /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/
    );
  });
});

describe("wrapVKWithRecoveryKey / unwrapVKWithRecoveryKey round-trip", () => {
  it("wraps and unwraps successfully", async () => {
    const vk = await generateVaultKey();
    const { recoveryKeyDisplay, recoveryWrappingKey } =
      await generateRecoveryKey();

    const wrapped = await wrapVKWithRecoveryKey(vk, recoveryWrappingKey);
    expect(wrapped).toBeInstanceOf(Uint8Array);
    expect(wrapped.byteLength).toBe(40);

    const unwrapped = await unwrapVKWithRecoveryKey(
      wrapped,
      recoveryKeyDisplay
    );
    expect(unwrapped.type).toBe("secret");
    expect(unwrapped.algorithm).toMatchObject({ name: "AES-GCM" });
  });

  it("unwrapped key can encrypt and decrypt entries", async () => {
    const vk = await generateVaultKey();
    const { recoveryKeyDisplay, recoveryWrappingKey } =
      await generateRecoveryKey();

    const entry: VaultEntry = {
      serviceName: "AWS",
      username: "admin",
      password: "hunter2",
      category: "cloud",
    };

    // Encrypt with original VK
    const blob = await encryptEntry(entry, vk);

    // Wrap and unwrap via recovery
    const wrapped = await wrapVKWithRecoveryKey(vk, recoveryWrappingKey);
    const recovered = await unwrapVKWithRecoveryKey(
      wrapped,
      recoveryKeyDisplay
    );

    // Decrypt with recovered VK
    const decrypted = await decryptEntry(blob, recovered);
    expect(decrypted).toEqual(entry);
  });

  it("throws with wrong recovery key", async () => {
    const vk = await generateVaultKey();
    const { recoveryWrappingKey } = await generateRecoveryKey();
    const { recoveryKeyDisplay: wrongDisplay } = await generateRecoveryKey();

    const wrapped = await wrapVKWithRecoveryKey(vk, recoveryWrappingKey);

    await expect(
      unwrapVKWithRecoveryKey(wrapped, wrongDisplay)
    ).rejects.toThrow();
  });
});
