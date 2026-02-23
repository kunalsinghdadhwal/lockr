// Base58 alphabet (Bitcoin variant): excludes 0, O, I, l to avoid visual ambiguity
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Generate a random recovery key and its corresponding AES-KW wrapping key.
 *
 * The `recoveryKeyDisplay` is a human-readable base58 string (groups of 4
 * separated by dashes) that the user writes down. It is shown ONCE and never
 * stored on the client or server in plaintext.
 */
export async function generateRecoveryKey(): Promise<{
  recoveryKeyDisplay: string;
  recoveryWrappingKey: CryptoKey;
}> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const encoded = base58Encode(bytes);

  // Format as dash-separated groups of 4 for readability: "3kF9-Ah2x-..."
  const display = encoded.match(/.{1,4}/g)!.join("-");

  const wrappingKey = await importRecoveryKeyBytes(bytes);

  return {
    recoveryKeyDisplay: display,
    recoveryWrappingKey: wrappingKey,
  };
}

/**
 * Wrap the Vault Key with a recovery wrapping key (AES-KW).
 * Returns raw bytes suitable for BYTEA storage as `recovery_vault_key`.
 */
export async function wrapVKWithRecoveryKey(
  vaultKey: CryptoKey,
  recoveryWrappingKey: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const wrapped = await crypto.subtle.wrapKey(
    "raw",
    vaultKey,
    recoveryWrappingKey,
    "AES-KW",
  );
  return new Uint8Array(wrapped);
}

/**
 * Unwrap the Vault Key using a recovery key string entered by the user.
 *
 * The user provides the dash-separated base58 string they wrote down at
 * setup time. Throws if the recovery key is incorrect (AES-KW integrity check).
 */
export async function unwrapVKWithRecoveryKey(
  wrappedVK: Uint8Array<ArrayBuffer>,
  recoveryKeyInput: string,
): Promise<CryptoKey> {
  // Strip dashes and decode base58 back to 32 bytes
  const cleaned = recoveryKeyInput.replace(/-/g, "");
  const decoded = base58Decode(cleaned);

  // Ensure exactly 32 bytes (AES-256 key length)
  if (decoded.length !== 32) {
    throw new Error(
      `Invalid recovery key: expected 32 bytes, got ${decoded.length}`,
    );
  }
  const bytes = decoded;

  const unwrappingKey = await importRecoveryKeyBytes(bytes);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedVK,
    unwrappingKey,
    "AES-KW",
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function importRecoveryKeyBytes(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bytes,
    "AES-KW",
    false,
    ["wrapKey", "unwrapKey"],
  );
}

// ---------------------------------------------------------------------------
// Base58 encode/decode (no external dependency)
// ---------------------------------------------------------------------------

function base58Encode(input: Uint8Array<ArrayBuffer>): string {
  if (input.length === 0) return "";

  // Count leading zeros
  let zeros = 0;
  while (zeros < input.length && input[zeros] === 0) {
    zeros++;
  }

  // Convert to base58 using BigInt arithmetic
  let num = BigInt(0);
  for (let i = 0; i < input.length; i++) {
    num = num * BigInt(256) + BigInt(input[i]);
  }

  let encoded = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    encoded = BASE58_ALPHABET[remainder] + encoded;
  }

  // Preserve leading zeros as '1' (first character of base58 alphabet)
  return BASE58_ALPHABET[0].repeat(zeros) + encoded;
}

function base58Decode(input: string): Uint8Array<ArrayBuffer> {
  if (input.length === 0) return new Uint8Array(0);

  // Count leading '1's (base58 representation of zero bytes)
  let zeros = 0;
  while (zeros < input.length && input[zeros] === BASE58_ALPHABET[0]) {
    zeros++;
  }

  // Convert from base58 using BigInt arithmetic
  let num = BigInt(0);
  for (let i = 0; i < input.length; i++) {
    const charIndex = BASE58_ALPHABET.indexOf(input[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid base58 character: ${input[i]}`);
    }
    num = num * BigInt(58) + BigInt(charIndex);
  }

  // Convert BigInt to byte array
  const hexStr = num === BigInt(0) ? "" : num.toString(16);
  const paddedHex = hexStr.length % 2 === 0 ? hexStr : "0" + hexStr;
  const byteLength = paddedHex.length / 2;

  const result = new Uint8Array(zeros + byteLength);
  for (let i = 0; i < byteLength; i++) {
    result[zeros + i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }

  return result;
}
