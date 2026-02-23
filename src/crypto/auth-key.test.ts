import { describe, it, expect } from "vitest";
import { deriveAuthKeyHash } from "./auth-key";

describe("deriveAuthKeyHash", () => {
  it("returns a 64-character hex string", async () => {
    const mekBits = crypto.getRandomValues(new Uint8Array(32));
    const hash = await deriveAuthKeyHash(mekBits);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces consistent output for the same input", async () => {
    const mekBits = new Uint8Array(32).fill(42);
    const a = await deriveAuthKeyHash(mekBits);
    const b = await deriveAuthKeyHash(mekBits);
    expect(a).toBe(b);
  });

  it("produces different output for different inputs", async () => {
    const mekA = new Uint8Array(32).fill(1);
    const mekB = new Uint8Array(32).fill(2);
    const hashA = await deriveAuthKeyHash(mekA);
    const hashB = await deriveAuthKeyHash(mekB);
    expect(hashA).not.toBe(hashB);
  });
});
