# Implementation Plan: `src/crypto/` Directory

This plan implements the 6 files in `src/crypto/` as defined in `docs/ARCHITECTURE.md`. Each phase produces one file. Phases are ordered by dependency -- later files import from earlier ones.

**Dependency chain:**
```
store.ts (no deps)
   ^
kdf.ts (imports store for types only)
   ^
auth-key.ts (imports nothing from crypto/)
   ^
vault-key.ts (no crypto/ imports)
   ^
entry-crypto.ts (no crypto/ imports)
   ^
recovery.ts (no crypto/ imports)
```

All files are client-side only (`"use client"` or imported by client components). All crypto uses the **Web Crypto API (SubtleCrypto)** -- zero Node.js `crypto` imports.

---

## Phase 0: Documentation Reference (Verified APIs)

### Web Crypto API (SubtleCrypto) -- MDN

**PBKDF2 key derivation (two steps):**
```typescript
// Step 1: Import password as key material
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits", "deriveKey"]
);

// Step 2: Derive key
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt: Uint8Array, iterations: 600000, hash: "SHA-256" },
  keyMaterial,
  { name: "AES-KW", length: 256 },  // or AES-GCM depending on usage
  false,                              // extractable
  ["wrapKey", "unwrapKey"]            // usages
);
```

**HKDF key derivation (two steps):**
```typescript
// Step 1: Import base key material
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  mekBytes,   // ArrayBuffer or Uint8Array
  "HKDF",
  false,
  ["deriveBits"]
);

// Step 2: Derive bits (for auth key we want raw bytes, not a CryptoKey)
const derivedBits = await crypto.subtle.deriveBits(
  {
    name: "HKDF",
    salt: new Uint8Array(0),    // empty salt is valid for HKDF
    info: new TextEncoder().encode("lockr-auth"),
    hash: "SHA-256"
  },
  keyMaterial,
  256   // bit length
);
// derivedBits is an ArrayBuffer (32 bytes)
```

**AES-GCM encrypt/decrypt:**
```typescript
// Encrypt -- returns ArrayBuffer with ciphertext + 16-byte auth tag appended
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: Uint8Array(12) },
  key,        // CryptoKey
  plaintext   // ArrayBuffer
);

// Decrypt -- expects ciphertext + appended auth tag
const plaintext = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv: Uint8Array(12) },
  key,
  ciphertext  // ArrayBuffer (ciphertext + tag)
);
```

**AES-KW wrap/unwrap:**
```typescript
// Wrap -- keyToWrap must be a CryptoKey with extractable=true
const wrapped = await crypto.subtle.wrapKey(
  "raw",          // export format
  keyToWrap,      // CryptoKey to wrap
  wrappingKey,    // CryptoKey (AES-KW)
  "AES-KW"        // wrapping algorithm
);
// wrapped is an ArrayBuffer

// Unwrap -- returns a CryptoKey
const unwrapped = await crypto.subtle.unwrapKey(
  "raw",
  wrappedKeyBuffer,   // ArrayBuffer
  unwrappingKey,      // CryptoKey (AES-KW)
  "AES-KW",           // unwrap algorithm
  "AES-GCM",          // algorithm of the unwrapped key
  true,               // extractable (needed for future re-wrapping)
  ["encrypt", "decrypt"]
);
```

**SHA-256 digest:**
```typescript
const hash = await crypto.subtle.digest("SHA-256", data); // ArrayBuffer -> ArrayBuffer
```

**Random bytes:**
```typescript
const bytes = crypto.getRandomValues(new Uint8Array(32));
```

### hash-wasm Argon2id

```typescript
import { argon2id } from "hash-wasm";

const result: Uint8Array = await argon2id({
  password: string,         // master password
  salt: Uint8Array,         // 16+ bytes
  parallelism: 1,
  iterations: 3,
  memorySize: 65536,        // 64 MB in KiB
  hashLength: 32,           // 256-bit output
  outputType: "binary"      // returns Uint8Array (NOT hex string)
});
```

Interface: `IArgon2Options { password, salt, secret?, iterations, parallelism, memorySize, hashLength, outputType? }`

### Zustand

```typescript
// Vanilla store (accessible outside React components)
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

const store = createStore<State>()((set) => ({ ... }));

// Imperative access (in crypto utility functions):
store.getState()
store.setState({ key: value })

// React hook (in components):
function Component() {
  const value = useStore(store, (s) => s.value);
}
```

Zustand does NOT persist by default -- state is in-memory only. CryptoKey objects (non-serializable) can be stored without issues.

### Anti-Patterns to Avoid

- **DO NOT** `import crypto from "crypto"` -- that is the Node.js module
- **DO NOT** use `localStorage` or `sessionStorage` for keys
- **DO NOT** make CryptoKey objects serializable/extractable unless needed for wrapping
- **DO NOT** use `deriveKey` for auth key -- use `deriveBits` since we need raw bytes for hashing, not a CryptoKey
- **DO NOT** hardcode salt values -- always generate randomly per user
- **DO NOT** use `tagLength` parameter in AES-GCM -- the default 128-bit (16 bytes) is correct
- **DO NOT** import `argon2id` at top level -- dynamically import for premium-only code splitting

---

## Phase 1: `src/crypto/store.ts` -- In-Memory Key Store

**What to implement:**
A Zustand vanilla store that holds the Vault Key (`CryptoKey | null`) in memory. Provides `setVaultKey`, `clearKeys`, and `getVaultKey` functions. Also stores `isUnlocked` boolean state.

**Exported interface:**
```typescript
interface VaultStore {
  vaultKey: CryptoKey | null;
  isUnlocked: boolean;
  setVaultKey: (key: CryptoKey) => void;
  clearKeys: () => void;
}

// Exports:
export const vaultStore: StoreApi<VaultStore>
export function useVaultStore<T>(selector: (state: VaultStore) => T): T
```

**Implementation notes:**
- Use `createStore` from `zustand/vanilla` so it is accessible from other crypto files (non-React)
- Export a `useVaultStore` wrapper hook using `useStore` from `zustand` for React components
- `clearKeys()` sets `vaultKey` to `null` and `isUnlocked` to `false` -- called on lock/logout
- No persist middleware. No devtools in production.

**Documentation reference:**
- Zustand vanilla store pattern: Context7 `/pmndrs/zustand` -- `createStore` from `zustand/vanilla`
- React hook wrapper: `useStore(store, selector)` from `zustand`

**Verification:**
- `vaultStore.getState().vaultKey` is `null` on init
- `setVaultKey(key)` -> `getState().vaultKey` is the key, `isUnlocked` is `true`
- `clearKeys()` -> `getState().vaultKey` is `null`, `isUnlocked` is `false`
- No `localStorage`/`sessionStorage` references in the file (grep check)

---

## Phase 2: `src/crypto/kdf.ts` -- Key Derivation Functions

**What to implement:**
Two functions for deriving the Master Encryption Key (MEK) from a master password + salt. One for free tier (PBKDF2), one for premium (Argon2id). Both return a `CryptoKey` usable with AES-KW for wrapping/unwrapping.

**Exported interface:**
```typescript
interface KdfParams {
  algo: "pbkdf2" | "argon2id";
  iterations: number;
  memory?: number;       // KiB, argon2id only
  parallelism?: number;  // argon2id only
}

export async function deriveMEK(
  password: string,
  salt: Uint8Array,
  params: KdfParams
): Promise<CryptoKey>

export function generateSalt(): Uint8Array  // 32 random bytes
```

**Implementation notes:**

For PBKDF2:
1. `crypto.subtle.importKey("raw", encodedPassword, "PBKDF2", false, ["deriveBits", "deriveKey"])`
2. `crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: params.iterations, hash: "SHA-256" }, keyMaterial, { name: "AES-KW", length: 256 }, false, ["wrapKey", "unwrapKey"])`

For Argon2id:
1. Dynamically import: `const { argon2id } = await import("hash-wasm")`
2. Call `argon2id({ password, salt, parallelism: params.parallelism, iterations: params.iterations, memorySize: params.memory, hashLength: 32, outputType: "binary" })` -- returns `Uint8Array`
3. Import the raw bytes as an AES-KW CryptoKey: `crypto.subtle.importKey("raw", derivedBytes, "AES-KW", false, ["wrapKey", "unwrapKey"])`

`generateSalt()`: `crypto.getRandomValues(new Uint8Array(32))`

**Documentation reference:**
- PBKDF2 pattern: MDN `SubtleCrypto.deriveKey()` with PBKDF2 -- Context7 `/mdn/content`
- Argon2id: hash-wasm `argon2id()` with `outputType: "binary"` -- Context7 `/daninet/hash-wasm`
- `importKey` for AES-KW: MDN unwrapKey example, `importKey("raw", ..., "AES-KW", false, ["wrapKey", "unwrapKey"])`

**Anti-pattern guards:**
- PBKDF2 iterations must be 600,000 (not 10,000 like the old code)
- Argon2id is dynamically imported (tree-shaking for free tier users)
- The derived key `extractable` must be `false` -- MEK should never be exportable
- MEK key usages are `["wrapKey", "unwrapKey"]` only -- it is NOT used for encryption directly

**Verification:**
- `deriveMEK("test", salt, { algo: "pbkdf2", iterations: 600000 })` returns a `CryptoKey` with type `"secret"` and usages `["wrapKey", "unwrapKey"]`
- `deriveMEK("test", salt, { algo: "argon2id", iterations: 3, memory: 65536, parallelism: 1 })` returns a `CryptoKey` with same properties
- Same password + same salt + same params = same wrapping behavior (deterministic)
- `generateSalt()` returns 32 bytes, two calls produce different values
- No `import crypto from "crypto"` in the file (grep check)
- `hash-wasm` is dynamically imported, not at top level

---

## Phase 3: `src/crypto/auth-key.ts` -- Auth Key Derivation

**What to implement:**
Derive an Auth Key from the MEK using HKDF, then hash it with SHA-256. The Auth Key hash is sent to the server for master password verification. The server stores the hash; the MEK is never transmitted.

**Exported interface:**
```typescript
export async function deriveAuthKeyHash(mek: CryptoKey): Promise<string>
// Returns hex-encoded SHA-256(HKDF(MEK, "lockr-auth"))
```

**Implementation notes:**

1. Export the MEK as raw bytes: `crypto.subtle.exportKey("raw", mek)` -- **wait, MEK has `extractable: false`**. This is a problem. We need the raw bytes to feed into HKDF.

   **Solution:** In `kdf.ts`, use `deriveBits` instead of `deriveKey` to get raw MEK bytes, then create TWO CryptoKeys from those bytes:
   - One AES-KW key (for wrapping, `extractable: false`)
   - One HKDF key material (for auth key derivation)

   **Revised approach for kdf.ts:** `deriveMEK` returns `{ wrappingKey: CryptoKey, rawKeyBytes: Uint8Array }`. The `rawKeyBytes` are used by `deriveAuthKeyHash` and then zeroed. OR, alternatively, make MEK extractable (less ideal but simpler).

   **Better approach:** `deriveMEK` returns the raw bytes. The caller (`store.ts` or vault-key functions) imports them as CryptoKey when needed. This is the most flexible.

   **Final approach adopted:**
   ```typescript
   // kdf.ts exports:
   export async function deriveMEKBits(password, salt, params): Promise<Uint8Array>
   // Returns raw 32-byte MEK

   // Callers import the bits as CryptoKey for their specific purpose
   ```

   Then `auth-key.ts`:
   1. Import MEK bits as HKDF key material: `crypto.subtle.importKey("raw", mekBits, "HKDF", false, ["deriveBits"])`
   2. Derive auth key bits: `crypto.subtle.deriveBits({ name: "HKDF", salt: new Uint8Array(0), info: encoder.encode("lockr-auth"), hash: "SHA-256" }, hkdfKey, 256)`
   3. Hash: `crypto.subtle.digest("SHA-256", authKeyBits)`
   4. Convert to hex string

**Hex encoding helper** (inline, no dependency):
```typescript
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
```

**Documentation reference:**
- HKDF pattern: MDN `SubtleCrypto.deriveKey()` with HKDF -- Context7 `/mdn/content`
- `deriveBits` for raw output: MDN `SubtleCrypto.deriveBits()`
- SHA-256 digest: `crypto.subtle.digest("SHA-256", data)`

**Anti-pattern guards:**
- HKDF salt can be empty (`new Uint8Array(0)`) -- this is valid per RFC 5869
- HKDF info MUST be `"lockr-auth"` encoded as UTF-8 -- this is the context separator
- The output is `hex(SHA-256(authKey))`, NOT the raw auth key -- the hash adds a layer so even if the server leaks auth_key_hash, the auth key itself (and by extension MEK) is not recoverable
- Never send raw auth key bits to the server, only the hash

**Verification:**
- Same MEK bits always produce the same auth key hash (deterministic)
- Output is a 64-character hex string (SHA-256 = 32 bytes = 64 hex chars)
- Different MEK bits produce different hashes

**IMPORTANT revision to Phase 2:**
`kdf.ts` must be revised. Instead of returning `CryptoKey` directly, it should return raw bytes (`Uint8Array`). A separate helper `importMEKForWrapping(mekBits)` imports the bytes as an AES-KW CryptoKey. This is needed because the same MEK bits are used for both wrapping (AES-KW) and auth key derivation (HKDF), which require different CryptoKey imports.

Updated `kdf.ts` exports:
```typescript
export async function deriveMEKBits(
  password: string,
  salt: Uint8Array,
  params: KdfParams
): Promise<Uint8Array>
// Returns raw 32-byte key material

export async function importMEKForWrapping(
  mekBits: Uint8Array
): Promise<CryptoKey>
// Imports as AES-KW key with ["wrapKey", "unwrapKey"]

export function generateSalt(): Uint8Array
```

---

## Phase 4: `src/crypto/vault-key.ts` -- Vault Key Generation, Wrap/Unwrap

**What to implement:**
Generate a random 256-bit Vault Key, wrap it with MEK (AES-KW), and unwrap it back. The VK is the key used for encrypting/decrypting all vault entries.

**Exported interface:**
```typescript
export async function generateVaultKey(): Promise<CryptoKey>

export async function wrapVaultKey(
  vaultKey: CryptoKey,
  mekWrappingKey: CryptoKey
): Promise<Uint8Array>
// Returns the wrapped VK bytes (for server storage as BYTEA)

export async function unwrapVaultKey(
  wrappedVK: Uint8Array,
  mekWrappingKey: CryptoKey
): Promise<CryptoKey>
// Returns the unwrapped VK CryptoKey
```

**Implementation notes:**

`generateVaultKey()`:
```typescript
return crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,    // extractable = true (MUST be true for wrapKey to work)
  ["encrypt", "decrypt"]
);
```

`wrapVaultKey()`:
```typescript
const wrapped = await crypto.subtle.wrapKey("raw", vaultKey, mekWrappingKey, "AES-KW");
return new Uint8Array(wrapped);
```

`unwrapVaultKey()`:
```typescript
return crypto.subtle.unwrapKey(
  "raw",
  wrappedVK.buffer,
  mekWrappingKey,
  "AES-KW",
  "AES-GCM",
  true,   // extractable = true (needed for re-wrapping on password change)
  ["encrypt", "decrypt"]
);
```

**Documentation reference:**
- AES-KW wrap/unwrap: MDN `SubtleCrypto.wrapKey()` and `SubtleCrypto.unwrapKey()` -- Context7 `/mdn/content`
- `generateKey`: MDN `SubtleCrypto.generateKey()` for AES-GCM

**Anti-pattern guards:**
- VK `extractable` MUST be `true` -- otherwise `wrapKey` throws `InvalidAccessError`
- VK usages are `["encrypt", "decrypt"]` -- it encrypts entries, not wraps keys
- MEK wrapping key usages are `["wrapKey", "unwrapKey"]` -- it wraps the VK
- `unwrapKey` format is `"raw"` not `"jwk"` -- we stored raw bytes

**Verification:**
- Generate VK -> wrap with MEK -> unwrap with same MEK -> encrypt+decrypt a test string -> should round-trip
- Unwrap with wrong MEK -> should throw (AES-KW integrity check fails)
- Wrapped VK is 40 bytes (32-byte key + 8-byte AES-KW overhead)
- `generateVaultKey()` produces different keys on each call

---

## Phase 5: `src/crypto/entry-crypto.ts` -- Entry Encryption/Decryption

**What to implement:**
Encrypt and decrypt vault entry blobs using AES-256-GCM with the Vault Key. Each entry is a JSON object containing all fields (serviceName, username, password, notes, category). Output is a packed binary: `IV (12B) | ciphertext + auth tag`.

**Exported interface:**
```typescript
interface VaultEntry {
  serviceName: string;
  username: string;
  password: string;
  notes?: string;
  category: string;
}

export async function encryptEntry(
  entry: VaultEntry,
  vaultKey: CryptoKey
): Promise<Uint8Array>
// Returns packed binary: IV (12) | ciphertext | auth tag (16)

export async function decryptEntry(
  encryptedBlob: Uint8Array,
  vaultKey: CryptoKey
): Promise<VaultEntry>
// Parses packed binary, decrypts, returns parsed JSON
```

**Implementation notes:**

`encryptEntry()`:
```typescript
const iv = crypto.getRandomValues(new Uint8Array(12));
const plaintext = new TextEncoder().encode(JSON.stringify(entry));
const ciphertextWithTag = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  vaultKey,
  plaintext
);
// Pack: IV (12 bytes) | ciphertextWithTag (variable, includes 16-byte auth tag)
const packed = new Uint8Array(12 + ciphertextWithTag.byteLength);
packed.set(iv, 0);
packed.set(new Uint8Array(ciphertextWithTag), 12);
return packed;
```

`decryptEntry()`:
```typescript
const iv = encryptedBlob.slice(0, 12);
const ciphertextWithTag = encryptedBlob.slice(12);
const plaintext = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv },
  vaultKey,
  ciphertextWithTag
);
return JSON.parse(new TextDecoder().decode(plaintext)) as VaultEntry;
```

**Base64 helpers for API transport** (also exported):
```typescript
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
```

**Documentation reference:**
- AES-GCM encrypt/decrypt: MDN `SubtleCrypto.encrypt()` -- Context7 `/mdn/content`
- Auth tag is automatically appended by Web Crypto (16 bytes by default, no `tagLength` param needed)

**Anti-pattern guards:**
- IV MUST be 12 bytes for AES-GCM (the recommended size per NIST)
- IV MUST be randomly generated per encryption call -- never reuse an IV
- Do NOT specify `tagLength` -- default 128-bit (16 bytes) is correct
- Do NOT use `additionalData` (AAD) unless there is a specific need
- `JSON.parse` failure on decrypt should throw a meaningful error (wrong key / corrupted data)

**Verification:**
- Encrypt entry -> decrypt with same VK -> deep equal to original entry
- Decrypt with wrong VK -> throws `OperationError` (GCM auth tag mismatch)
- Encrypted blob size = 12 (IV) + plaintext.length + 16 (tag) + AES block overhead
- Two encryptions of the same entry produce different blobs (random IV)
- Base64 round-trip: `fromBase64(toBase64(bytes))` equals original bytes

---

## Phase 6: `src/crypto/recovery.ts` -- Recovery Key (Premium)

**What to implement:**
Generate a random recovery key, display it as a human-readable base58 string, and use it to wrap/unwrap the Vault Key. This provides a second wrapping of VK that does not depend on the master password.

**Exported interface:**
```typescript
export async function generateRecoveryKey(): Promise<{
  recoveryKeyDisplay: string;   // base58-encoded string for user to write down
  recoveryWrappingKey: CryptoKey;  // AES-KW key derived from recovery key bytes
}>

export async function wrapVKWithRecoveryKey(
  vaultKey: CryptoKey,
  recoveryWrappingKey: CryptoKey
): Promise<Uint8Array>

export async function unwrapVKWithRecoveryKey(
  wrappedVK: Uint8Array,
  recoveryKeyInput: string   // base58 string the user types in
): Promise<CryptoKey>
```

**Implementation notes:**

`generateRecoveryKey()`:
1. Generate 32 random bytes: `crypto.getRandomValues(new Uint8Array(32))`
2. Encode as base58 for display (human-friendly, no ambiguous characters)
3. Import the raw bytes as AES-KW key: `crypto.subtle.importKey("raw", bytes, "AES-KW", false, ["wrapKey", "unwrapKey"])`

**Base58 encoding** (inline implementation, no dependency):
Alphabet: `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`
(excludes 0, O, I, l to avoid visual ambiguity)

The recovery key string will be ~44 characters for 32 bytes. Format for display: groups of 4 separated by dashes (e.g., `3kF9-Ah2x-...`).

`wrapVKWithRecoveryKey()`: same as `wrapVaultKey()` from vault-key.ts but with recovery wrapping key.

`unwrapVKWithRecoveryKey()`:
1. Decode base58 input back to 32 bytes
2. Import as AES-KW key
3. `crypto.subtle.unwrapKey(...)` same as vault-key.ts pattern

**Documentation reference:**
- AES-KW: same pattern as Phase 4 (vault-key.ts)
- Base58: Bitcoin base58 alphabet (no external dependency)

**Anti-pattern guards:**
- Recovery key is shown ONCE and never stored on the client
- The base58 string must be decodable back to the exact same 32 bytes
- If the user enters the wrong recovery key, `unwrapKey` will throw (AES-KW integrity check)
- Recovery key bytes are NOT derived from anything -- they are pure random

**Verification:**
- Generate recovery key -> wrap VK -> unwrap VK with same recovery key -> VK works for encrypt/decrypt
- Unwrap with wrong recovery key -> throws
- `recoveryKeyDisplay` is a valid base58 string (no 0, O, I, l characters)
- Decode(encode(bytes)) round-trips correctly

---

## Phase 7: Integration Verification

After all 6 files are implemented, verify the full flow end-to-end:

**Test 1: Sign-up flow**
```
1. generateSalt() -> salt
2. deriveMEKBits("masterpass", salt, { algo: "pbkdf2", iterations: 600000 }) -> mekBits
3. importMEKForWrapping(mekBits) -> mekKey
4. deriveAuthKeyHash(mekBits) -> authKeyHash (64-char hex string)
5. generateVaultKey() -> vk
6. wrapVaultKey(vk, mekKey) -> wrappedVK
7. The server would store: salt, wrappedVK, authKeyHash, kdfParams
```

**Test 2: Unlock flow**
```
1. deriveMEKBits("masterpass", storedSalt, storedKdfParams) -> mekBits
2. deriveAuthKeyHash(mekBits) -> hash, compare with stored authKeyHash
3. importMEKForWrapping(mekBits) -> mekKey
4. unwrapVaultKey(storedWrappedVK, mekKey) -> vk
5. vaultStore.setState({ vaultKey: vk, isUnlocked: true })
```

**Test 3: Encrypt/decrypt entry**
```
1. vk = vaultStore.getState().vaultKey
2. encryptEntry({ serviceName: "GitHub", username: "user", password: "pass123", category: "dev" }, vk) -> blob
3. toBase64(blob) -> base64 string (for API transport)
4. fromBase64(base64) -> blob back
5. decryptEntry(blob, vk) -> original entry
```

**Test 4: Master password change**
```
1. Unlock with old password -> get vk
2. deriveMEKBits("newpass", newSalt, params) -> newMekBits
3. importMEKForWrapping(newMekBits) -> newMekKey
4. wrapVaultKey(vk, newMekKey) -> newWrappedVK
5. deriveAuthKeyHash(newMekBits) -> newAuthKeyHash
6. Server stores: newSalt, newWrappedVK, newAuthKeyHash
7. No entries re-encrypted
```

**Test 5: Recovery key (premium)**
```
1. generateRecoveryKey() -> { recoveryKeyDisplay, recoveryWrappingKey }
2. wrapVKWithRecoveryKey(vk, recoveryWrappingKey) -> recoveryWrappedVK
3. Server stores recoveryWrappedVK
4. Later: unwrapVKWithRecoveryKey(recoveryWrappedVK, recoveryKeyDisplay) -> vk
5. Verify vk works for decrypt
```

**Grep checks across all files:**
```bash
# Must find ZERO matches:
grep -r "from \"crypto\"" src/crypto/        # No Node.js crypto
grep -r "localStorage" src/crypto/           # No localStorage
grep -r "sessionStorage" src/crypto/         # No sessionStorage
grep -r "indexedDB" src/crypto/              # No IndexedDB

# Must find matches:
grep -r "crypto.subtle" src/crypto/          # Web Crypto API used
grep -r "crypto.getRandomValues" src/crypto/ # Secure random used
```
