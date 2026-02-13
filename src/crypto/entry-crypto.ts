const IV_LENGTH = 12;

export interface VaultEntry {
  serviceName: string;
  username: string;
  password: string;
  notes?: string;
  category: string;
}

/**
 * Encrypt a vault entry as a packed binary blob.
 *
 * Layout: IV (12 bytes) | ciphertext + auth tag (16 bytes appended by AES-GCM)
 * The entire entry is JSON-serialized before encryption so all fields
 * (serviceName, username, password, notes, category) are opaque to the server.
 */
export async function encryptEntry(
  entry: VaultEntry,
  vaultKey: CryptoKey,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify(entry));

  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    vaultKey,
    plaintext,
  );

  const packed = new Uint8Array(IV_LENGTH + ciphertextWithTag.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertextWithTag), IV_LENGTH);
  return packed;
}

/**
 * Decrypt a packed binary blob back into a VaultEntry.
 *
 * Throws OperationError if the vault key is wrong or the blob is tampered with
 * (AES-GCM auth tag verification failure).
 */
export async function decryptEntry(
  encryptedBlob: Uint8Array,
  vaultKey: CryptoKey,
): Promise<VaultEntry> {
  const iv = encryptedBlob.slice(0, IV_LENGTH);
  const ciphertextWithTag = encryptedBlob.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    vaultKey,
    ciphertextWithTag,
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as VaultEntry;
}

// ---------------------------------------------------------------------------
// Base64 helpers for API transport (BYTEA <-> JSON)
// ---------------------------------------------------------------------------

/**
 * Encode a Uint8Array to a base64 string for JSON transport.
 * On disk (PostgreSQL BYTEA) the data is stored as raw bytes -- base64
 * overhead exists only in transit.
 */
export function toBase64(bytes: Uint8Array): string {
  // Process in 8KB chunks to avoid stack overflow on large blobs
  // while keeping O(n) concatenation via array join
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    chunks.push(String.fromCharCode(...slice));
  }
  return btoa(chunks.join(""));
}

/**
 * Decode a base64 string back to a Uint8Array.
 */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
