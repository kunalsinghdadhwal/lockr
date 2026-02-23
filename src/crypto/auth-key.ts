const AUTH_KEY_CONTEXT = "lockr-auth";

/**
 * Derive an Auth Key from raw MEK bytes using HKDF, then hash it with SHA-256.
 *
 * Returns a 64-character hex string: hex(SHA-256(HKDF(MEK, "lockr-auth"))).
 * This hash is stored server-side for master password verification.
 * The server never receives the MEK or the raw auth key.
 */
export async function deriveAuthKeyHash(
  mekBits: Uint8Array<ArrayBuffer>,
): Promise<string> {
  // Import MEK bytes as HKDF key material
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    mekBits,
    "HKDF",
    false,
    ["deriveBits"],
  );

  // Derive 256-bit auth key using HKDF-SHA256
  const authKeyBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(AUTH_KEY_CONTEXT),
      hash: "SHA-256",
    },
    hkdfKey,
    256,
  );

  // Hash the auth key with SHA-256 before sending to server
  const hash = await crypto.subtle.digest("SHA-256", authKeyBits);

  return bufferToHex(hash);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
