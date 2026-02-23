import { describe, it, expect } from "vitest";
import {
  deriveMEKBits,
  importMEKForWrapping,
  generateSalt,
  PBKDF2_DEFAULT,
  ARGON2ID_DEFAULT,
} from "./kdf";

describe("KDF constants", () => {
  it("PBKDF2_DEFAULT has correct shape", () => {
    expect(PBKDF2_DEFAULT).toEqual({
      algo: "pbkdf2",
      iterations: 600_000,
    });
  });

  it("ARGON2ID_DEFAULT has correct shape", () => {
    expect(ARGON2ID_DEFAULT).toEqual({
      algo: "argon2id",
      iterations: 3,
      memory: 65_536,
      parallelism: 1,
    });
  });
});

describe("generateSalt", () => {
  it("returns a 32-byte Uint8Array", () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.byteLength).toBe(32);
  });

  it("returns different values on successive calls", () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).not.toEqual(b);
  });
});

describe("deriveMEKBits (PBKDF2)", () => {
  const password = "test-master-password";
  const salt = new Uint8Array(32);
  // Use lower iterations for test speed
  const fastParams = { algo: "pbkdf2" as const, iterations: 1000 };

  it("returns a 32-byte Uint8Array", async () => {
    const mek = await deriveMEKBits(password, salt, fastParams);
    expect(mek).toBeInstanceOf(Uint8Array);
    expect(mek.byteLength).toBe(32);
  });

  it("produces consistent output with the same inputs", async () => {
    const a = await deriveMEKBits(password, salt, fastParams);
    const b = await deriveMEKBits(password, salt, fastParams);
    expect(a).toEqual(b);
  });

  it("produces different output with different passwords", async () => {
    const a = await deriveMEKBits("password-a", salt, fastParams);
    const b = await deriveMEKBits("password-b", salt, fastParams);
    expect(a).not.toEqual(b);
  });

  it("produces different output with different salts", async () => {
    const saltA = new Uint8Array(32).fill(0);
    const saltB = new Uint8Array(32).fill(1);
    const a = await deriveMEKBits(password, saltA, fastParams);
    const b = await deriveMEKBits(password, saltB, fastParams);
    expect(a).not.toEqual(b);
  });
});

describe("importMEKForWrapping", () => {
  it("returns a CryptoKey with wrapKey/unwrapKey usages", async () => {
    const mekBits = crypto.getRandomValues(new Uint8Array(32));
    const key = await importMEKForWrapping(mekBits);
    expect(key).toBeDefined();
    expect(key.type).toBe("secret");
    expect(key.algorithm).toMatchObject({ name: "AES-KW" });
    expect(key.usages).toContain("wrapKey");
    expect(key.usages).toContain("unwrapKey");
    expect(key.extractable).toBe(false);
  });
});
