/**
 * Generate a random 256-bit AES-GCM key to serve as the Vault Key.
 *
 * The VK is extractable (required for AES-KW wrapping) and its usages
 * are encrypt/decrypt (it encrypts vault entries, not other keys).
 */
export async function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Wrap the Vault Key with the MEK using AES-KW.
 *
 * Returns raw bytes suitable for BYTEA storage on the server.
 * The output is 40 bytes: 32-byte key + 8-byte AES-KW integrity overhead.
 */
export async function wrapVaultKey(
  vaultKey: CryptoKey,
  mekWrappingKey: CryptoKey,
): Promise<Uint8Array> {
  const wrapped = await crypto.subtle.wrapKey(
    "raw",
    vaultKey,
    mekWrappingKey,
    "AES-KW",
  );
  return new Uint8Array(wrapped);
}

/**
 * Unwrap the Vault Key from its AES-KW wrapping using the MEK.
 *
 * Returns a CryptoKey usable for AES-GCM encrypt/decrypt operations.
 * Throws if the wrapping key is incorrect (AES-KW integrity check).
 */
export async function unwrapVaultKey(
  wrappedVK: Uint8Array,
  mekWrappingKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    "raw",
    wrappedVK,
    mekWrappingKey,
    "AES-KW",
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
}
