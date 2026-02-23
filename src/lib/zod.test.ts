import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  kdfParamsSchema,
  vaultSetupSchema,
  createEntrySchema,
  updateEntrySchema,
  rotateKeySchema,
  upgradeVaultSchema,
} from "./zod";

function expectSuccess(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  expect(schema.safeParse(value).success).toBe(true);
}

function expectFailure(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  expect(schema.safeParse(value).success).toBe(false);
}

// ---------- Auth schemas ----------

describe("signUpSchema", () => {
  const valid = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid input", () => expectSuccess(signUpSchema, valid));

  it("rejects missing name", () =>
    expectFailure(signUpSchema, { ...valid, name: "" }));

  it("rejects name over 50 chars", () =>
    expectFailure(signUpSchema, { ...valid, name: "a".repeat(51) }));

  it("rejects invalid email", () =>
    expectFailure(signUpSchema, { ...valid, email: "not-email" }));

  it("rejects short password", () =>
    expectFailure(signUpSchema, {
      ...valid,
      password: "short",
      confirmPassword: "short",
    }));

  it("rejects mismatched passwords", () =>
    expectFailure(signUpSchema, { ...valid, confirmPassword: "different123" }));
});

describe("signInSchema", () => {
  it("accepts valid input", () =>
    expectSuccess(signInSchema, {
      email: "test@example.com",
      password: "password123",
    }));

  it("rejects missing email", () =>
    expectFailure(signInSchema, { email: "", password: "password123" }));

  it("rejects short password", () =>
    expectFailure(signInSchema, { email: "a@b.com", password: "short" }));
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () =>
    expectSuccess(forgotPasswordSchema, { email: "user@test.com" }));

  it("rejects invalid email", () =>
    expectFailure(forgotPasswordSchema, { email: "bad" }));
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () =>
    expectSuccess(resetPasswordSchema, {
      password: "newpass12",
      confirmPassword: "newpass12",
    }));

  it("rejects mismatched passwords", () =>
    expectFailure(resetPasswordSchema, {
      password: "newpass12",
      confirmPassword: "different",
    }));
});

// ---------- Vault schemas ----------

describe("kdfParamsSchema", () => {
  it("accepts pbkdf2 params", () =>
    expectSuccess(kdfParamsSchema, { algo: "pbkdf2", iterations: 600000 }));

  it("accepts argon2id params", () =>
    expectSuccess(kdfParamsSchema, {
      algo: "argon2id",
      iterations: 3,
      memory: 65536,
      parallelism: 1,
    }));

  it("rejects unknown algo", () =>
    expectFailure(kdfParamsSchema, { algo: "scrypt" }));

  it("rejects negative iterations", () =>
    expectFailure(kdfParamsSchema, { algo: "pbkdf2", iterations: -1 }));
});

describe("vaultSetupSchema", () => {
  const valid = {
    vault_salt: "abc",
    encrypted_vault_key: "def",
    auth_key_hash: "a".repeat(64),
    kdf_params: { algo: "pbkdf2", iterations: 600000 },
  };

  it("accepts valid input", () => expectSuccess(vaultSetupSchema, valid));

  it("rejects empty vault_salt", () =>
    expectFailure(vaultSetupSchema, { ...valid, vault_salt: "" }));

  it("rejects wrong-length auth_key_hash", () =>
    expectFailure(vaultSetupSchema, { ...valid, auth_key_hash: "short" }));
});

describe("createEntrySchema", () => {
  it("accepts valid blob", () =>
    expectSuccess(createEntrySchema, { encrypted_blob: "data" }));

  it("rejects empty blob", () =>
    expectFailure(createEntrySchema, { encrypted_blob: "" }));
});

describe("updateEntrySchema", () => {
  it("accepts valid blob", () =>
    expectSuccess(updateEntrySchema, { encrypted_blob: "data" }));

  it("rejects empty blob", () =>
    expectFailure(updateEntrySchema, { encrypted_blob: "" }));
});

describe("rotateKeySchema", () => {
  const valid = {
    vault_salt: "salt",
    encrypted_vault_key: "key",
    auth_key_hash: "b".repeat(64),
    kdf_params: { algo: "argon2id", iterations: 3 },
  };

  it("accepts valid input", () => expectSuccess(rotateKeySchema, valid));

  it("rejects missing encrypted_vault_key", () =>
    expectFailure(rotateKeySchema, { ...valid, encrypted_vault_key: "" }));
});

describe("upgradeVaultSchema", () => {
  const valid = {
    encrypted_vault_key: "key",
    auth_key_hash: "c".repeat(64),
    kdf_params: { algo: "pbkdf2", iterations: 600000 },
  };

  it("accepts valid input without recovery key", () =>
    expectSuccess(upgradeVaultSchema, valid));

  it("accepts valid input with recovery key", () =>
    expectSuccess(upgradeVaultSchema, {
      ...valid,
      recovery_vault_key: "recovery",
    }));

  it("rejects missing auth_key_hash", () =>
    expectFailure(upgradeVaultSchema, { ...valid, auth_key_hash: "" }));
});
