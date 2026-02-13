export interface KdfParams {
  algo: "pbkdf2" | "argon2id";
  iterations: number;
  memory?: number;
  parallelism?: number;
}

const PBKDF2_DEFAULT: KdfParams = {
  algo: "pbkdf2",
  iterations: 600_000,
};

const ARGON2ID_DEFAULT: KdfParams = {
  algo: "argon2id",
  iterations: 3,
  memory: 65_536,
  parallelism: 1,
};

export { PBKDF2_DEFAULT, ARGON2ID_DEFAULT };

/**
 * Derive raw 32-byte MEK (Master Encryption Key) from a master password and salt.
 *
 * Returns raw bytes so callers can import them as the specific CryptoKey type
 * they need (AES-KW for wrapping, HKDF for auth key derivation).
 */
export async function deriveMEKBits(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  if (params.algo === "argon2id") {
    return deriveWithArgon2id(password, salt, params);
  }
  return deriveWithPBKDF2(password, salt, params);
}

/**
 * Import raw MEK bytes as an AES-KW CryptoKey for wrapping/unwrapping the Vault Key.
 */
export async function importMEKForWrapping(
  mekBits: Uint8Array,
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    mekBits,
    "AES-KW",
    false,
    ["wrapKey", "unwrapKey"],
  );
}

/**
 * Generate a cryptographically random 32-byte salt.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function deriveWithPBKDF2(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: params.iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

async function deriveWithArgon2id(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  const { argon2id } = await import("hash-wasm");

  const result = await argon2id({
    password,
    salt,
    parallelism: params.parallelism ?? 1,
    iterations: params.iterations,
    memorySize: params.memory ?? 65_536,
    hashLength: 32,
    outputType: "binary",
  });

  return result;
}
