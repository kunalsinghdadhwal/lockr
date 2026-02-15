# src/crypto/ -- Client-Side Cryptography

This directory contains all client-side encryption logic for Lockr. Every file here runs exclusively in the browser. Nothing in this directory is ever imported by server-side code (API routes, services, middleware).

---

## Key Hierarchy (read this first)

```
Master Password + Salt
        |
        v
   KDF (kdf.ts)  -->  MEK (Master Encryption Key, 256-bit)
        |                       |
        |                       +--> HKDF (auth-key.ts) --> Auth Key Hash (sent to server)
        |
        v
   AES-KW (vault-key.ts)  -->  Vault Key (VK, 256-bit, in-memory only)
        |
        v
   AES-256-GCM (entry-crypto.ts)  -->  Encrypted Entry Blobs (stored on server)

Recovery Key (recovery.ts) wraps VK independently (premium only).
```

The Vault Key encrypts all entries. The MEK wraps the Vault Key. Changing the master password re-wraps VK without re-encrypting entries.

---

## Files

| File | Responsibility | Key APIs |
|------|---------------|----------|
| `kdf.ts` | Derive MEK from master password + salt. PBKDF2 (free tier) or Argon2id via hash-wasm (premium). | `deriveMEKBits`, `importMEKForWrapping`, `generateSalt`, `KdfParams` |
| `vault-key.ts` | Generate, wrap (AES-KW), and unwrap the Vault Key using the MEK. | `generateVaultKey`, `wrapVaultKey`, `unwrapVaultKey` |
| `entry-crypto.ts` | AES-256-GCM encrypt/decrypt of vault entries. Also provides base64 helpers for API transport. | `encryptEntry`, `decryptEntry`, `toBase64`, `fromBase64`, `VaultEntry` |
| `auth-key.ts` | Derive auth key from MEK via HKDF-SHA256, then SHA-256 hash it. The hash is what the server stores for master password verification. | `deriveAuthKeyHash` |
| `recovery.ts` | Generate a random recovery key (base58 display string), wrap/unwrap VK with it. Premium feature. | `generateRecoveryKey`, `wrapVKWithRecoveryKey`, `unwrapVKWithRecoveryKey` |
| `store.ts` | Zustand vanilla store holding the VK in memory. Never persisted. | `vaultStore`, `useVaultStore`, `VaultStore` |

---

## Critical Rules

1. **Client-only.** Never import from this directory in any server-side file (`route.ts`, `services/`, `middleware.ts`). These modules depend on browser globals (`crypto.subtle`, `btoa`/`atob`).

2. **No persistent storage of keys.** VK and MEK must never be written to localStorage, sessionStorage, cookies, or IndexedDB. They live in JS memory only (`store.ts` Zustand store) and are cleared on lock/logout via `clearKeys()`.

3. **Random IV per encryption.** `encryptEntry` generates a fresh 12-byte IV for every call. Never reuse an IV with the same key -- AES-GCM is catastrophically broken on IV reuse.

4. **Blob layout is fixed-position.** `IV (12 bytes) | ciphertext + auth tag (appended by Web Crypto)`. There are no delimiters. Changing this layout breaks all stored entries.

5. **AES-KW integrity.** `unwrapVaultKey` and `unwrapVKWithRecoveryKey` throw `OperationError` if the wrapping key is wrong. This is the master password verification mechanism on the client side (in addition to the auth key hash check).

6. **Argon2id is dynamically imported.** `kdf.ts` uses `import("hash-wasm")` so the WASM bundle is only loaded for premium users. Do not convert this to a static import.

7. **Auth key is double-hashed.** `deriveAuthKeyHash` derives via HKDF then hashes with SHA-256 before returning. The server stores this hex hash. The raw HKDF output never leaves the browser.

8. **Recovery key is shown once.** `generateRecoveryKey` returns a base58 display string (dash-separated groups of 4). It is never stored anywhere after display. The server only stores the wrapped VK blob produced by `wrapVKWithRecoveryKey`.

9. **Base64 is for transport only.** `toBase64`/`fromBase64` in `entry-crypto.ts` exist for JSON API transport. The database stores raw BYTEA. Do not use base64 for anything else.

10. **VaultEntry shape matters.** The `VaultEntry` interface in `entry-crypto.ts` (`serviceName`, `username`, `password`, `notes?`, `category`) is what gets JSON-serialized and encrypted. Changing this interface affects all stored blobs -- old blobs will decrypt to the old shape.

---

## Algorithms Reference

| Operation | Algorithm | Key Size | Notes |
|-----------|-----------|----------|-------|
| KDF (free) | PBKDF2-SHA256 | 256-bit output | 600,000 iterations |
| KDF (premium) | Argon2id | 256-bit output | 64 MB memory, 3 iterations, parallelism 1 |
| VK wrapping | AES-KW | 256-bit | Output is 40 bytes (32 key + 8 integrity) |
| Entry encryption | AES-256-GCM | 256-bit | 12-byte random IV per entry |
| Auth key derivation | HKDF-SHA256 | 256-bit | Context string: `"lockr-auth"`, empty salt |
| Auth key hash | SHA-256 | 256-bit | Stored as 64-char hex string |

---

## Testing

Tests use Vitest. The Web Crypto API is available in Node 20+ via the global `crypto` object, so no polyfills are needed for unit tests. Test files should cover:

- Round-trip encrypt/decrypt with known keys
- Wrong key produces `OperationError` (not garbage output)
- IV uniqueness across multiple `encryptEntry` calls
- Base58 encode/decode round-trips (recovery.ts)
- KDF param defaults match the constants (`PBKDF2_DEFAULT`, `ARGON2ID_DEFAULT`)
