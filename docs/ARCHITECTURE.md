# Lockr -- Architecture & Product Overview

## What is Lockr?

Lockr is an end-to-end encrypted password manager built as a SaaS product. The server never has access to user passwords or vault contents in plaintext. All encryption and decryption happens client-side in the browser using the Web Crypto API.

Lockr uses a **vault key architecture** where a randomly generated Vault Key encrypts all entries, and the user's master password protects that Vault Key. This means changing your master password is instant (re-wrap one key) rather than re-encrypting every stored entry.

---

## System Overview

```mermaid
graph TB
    subgraph Client ["Browser (Client-Side)"]
        UI[React / Next.js UI]
        WC[Web Crypto API]
        KDF[Key Derivation<br/>PBKDF2 or Argon2id]
        ENC[AES-256-GCM<br/>Encrypt / Decrypt]
        KW[AES-KW<br/>Key Wrap / Unwrap]
        MEM[In-Memory Key Store<br/>React Context]
    end

    subgraph Server ["Server (Next.js API Routes)"]
        AUTH[Authentication<br/>better-auth]
        API[Vault API<br/>CRUD Encrypted Blobs]
        MW[Middleware<br/>Session Validation]
    end

    subgraph DB ["PostgreSQL"]
        UT[user table]
        ST[session table]
        ET[entries table<br/>encrypted blobs only]
        UKT[user_keys table<br/>public key + wrapped private key]
    end

    UI --> WC
    WC --> KDF
    WC --> ENC
    WC --> KW
    KDF --> MEM
    KW --> MEM
    MEM --> ENC

    UI -->|HTTPS| MW
    MW --> AUTH
    MW --> API
    AUTH --> UT
    AUTH --> ST
    API --> ET
    API --> UKT

    style Client fill:#1a1a2e,stroke:#e94560,color:#eee
    style Server fill:#16213e,stroke:#0f3460,color:#eee
    style DB fill:#0f3460,stroke:#533483,color:#eee
```

---

## Key Hierarchy

The core of Lockr's security model. Both tiers use this same structure.

```mermaid
graph TD
    MP["Master Password<br/>(never leaves the browser)"]
    SALT["Per-User Salt<br/>(32 bytes, stored on server)"]

    MP --> KDF
    SALT --> KDF

    KDF["KDF<br/>Free: PBKDF2-SHA256 600k iterations<br/>Premium: Argon2id 64MB / 3 iter"]

    KDF --> MEK["MEK<br/>Master Encryption Key<br/>(256-bit, in memory only)"]

    MEK --> HKDF["HKDF-SHA256<br/>context: 'lockr-auth'"]
    HKDF --> AK["Auth Key<br/>(sent to server for login verification)"]

    MEK --> UNWRAP["AES-KW Unwrap"]
    WVK["Wrapped Vault Key<br/>(stored on server, encrypted)"] --> UNWRAP
    UNWRAP --> VK["Vault Key (VK)<br/>(256-bit, in memory only)"]

    VK --> ENCRYPT["AES-256-GCM<br/>(random IV per entry)"]
    ENCRYPT --> BLOB["Encrypted Entry Blob<br/>(stored on server)"]

    RK["Recovery Key<br/>(Premium only)<br/>Displayed once, user writes it down"] --> RKWRAP["AES-KW Wrap"]
    VK2["Vault Key"] --> RKWRAP
    RKWRAP --> RBLOB["Recovery Vault Key Blob<br/>(stored on server)"]

    style MP fill:#e94560,stroke:#333,color:#fff
    style VK fill:#0f3460,stroke:#333,color:#fff
    style MEK fill:#533483,stroke:#333,color:#fff
    style AK fill:#16213e,stroke:#333,color:#fff
    style BLOB fill:#1a1a2e,stroke:#e94560,color:#eee
    style RK fill:#e94560,stroke:#333,color:#fff
```

**Key principle:** The server stores `Wrapped Vault Key` and `Encrypted Entry Blobs`. It cannot decrypt either without the MEK, which is derived from the master password, which never leaves the browser.

---

## Sign-Up Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant S as Server
    participant DB as PostgreSQL

    U->>U: Enter email, account password, master password
    U->>S: Sign up with email + account password (better-auth)
    S->>DB: Create user record, hash account password (bcrypt)
    S-->>U: Account created, verification email sent
    U->>U: Verify email

    Note over U: First-time vault setup
    U->>U: Generate random salt (32 bytes)
    U->>U: Derive MEK from master password + salt (KDF)
    U->>U: Derive Auth Key = HKDF(MEK, "lockr-auth")
    U->>U: Generate random Vault Key (256-bit)
    U->>U: Wrap VK with MEK (AES-KW)

    U->>S: POST /api/vault/setup
    Note right of U: { vault_salt, encrypted_vault_key,<br/>auth_key_hash: hash(Auth Key),<br/>kdf_params }
    S->>DB: Store vault_salt, encrypted_vault_key, auth_key_hash, kdf_params
    S-->>U: Vault initialized

    Note over U: If Premium: also generate & display recovery key,<br/>wrap VK with recovery key, send recovery_vault_key blob
```

---

## Unlock & Decrypt Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant S as Server
    participant DB as PostgreSQL

    U->>S: GET /api/vault/unlock (with session cookie)
    S->>DB: Fetch vault_salt, kdf_params, encrypted_vault_key, auth_key_hash
    S-->>U: Return vault metadata (all encrypted/hashed, safe to send)

    U->>U: Enter master password
    U->>U: Derive MEK from master password + salt (using kdf_params)
    U->>U: Derive Auth Key = HKDF(MEK, "lockr-auth")
    U->>U: Compare hash(Auth Key) with stored auth_key_hash

    alt Auth Key matches
        U->>U: Unwrap VK from encrypted_vault_key using MEK
        U->>U: Store VK in memory (React Context)
        U->>S: GET /api/vault/entries (with session cookie)
        S->>DB: Fetch encrypted blobs for user
        S-->>U: Return array of encrypted blobs
        U->>U: Decrypt each blob with VK (AES-256-GCM)
        U->>U: Display plaintext entries in UI
    else Auth Key does not match
        U->>U: Show "Wrong master password" error
    end

    Note over U: On lock / logout: zero VK from memory
```

---

## Save Entry Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant S as Server
    participant DB as PostgreSQL

    U->>U: Fill form: service name, username, password, notes, category
    U->>U: Build JSON: { serviceName, username, password, notes, category }
    U->>U: Encrypt JSON blob with VK (AES-256-GCM, random IV)
    Note right of U: Result: iv:ciphertext:authTag (base64)

    U->>S: POST /api/vault/entries (with session cookie)
    Note right of U: { encrypted_blob: "iv:ciphertext:authTag" }
    S->>S: Validate session, confirm user identity
    S->>DB: INSERT into entries (user_id, encrypted_blob)
    S-->>U: 201 Created
```

---

## Master Password Change Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant S as Server

    U->>U: Enter current master password
    U->>U: Derive old MEK, unwrap VK (verify Auth Key first)

    U->>U: Enter new master password
    U->>U: Generate new salt (optional, can reuse)
    U->>U: Derive new MEK from new password + salt
    U->>U: Derive new Auth Key = HKDF(new MEK, "lockr-auth")
    U->>U: Re-wrap VK with new MEK (AES-KW)

    U->>S: POST /api/vault/rotate-key
    Note right of U: { encrypted_vault_key: new wrapped VK,<br/>auth_key_hash: hash(new Auth Key),<br/>kdf_params, vault_salt }
    S->>S: Validate session
    S-->>U: 200 OK

    Note over U: Zero entries re-encrypted.<br/>VK is unchanged. Only the wrapping changed.
```

---

## Tier Upgrade Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant S as Server
    participant Pay as Payment Provider

    U->>Pay: Subscribe to Premium
    Pay-->>S: Webhook: user upgraded
    S->>S: Set user.tier = "premium"

    Note over U: Next time user unlocks vault
    U->>U: Enter master password
    U->>U: Derive old MEK (PBKDF2), unwrap VK

    U->>U: Re-derive MEK with Argon2id (new KDF)
    U->>U: Derive new Auth Key
    U->>U: Re-wrap VK with new MEK
    U->>U: Generate Recovery Key (random 256-bit, display as base58)
    U->>U: Wrap VK with Recovery Key

    U->>S: POST /api/vault/upgrade
    Note right of U: { encrypted_vault_key, recovery_vault_key,<br/>auth_key_hash, kdf_params }
    S-->>U: 200 OK

    Note over U: Zero entries re-encrypted.<br/>User writes down recovery key.
```

---

## Tier Comparison

### Vault & Storage

| Feature | Free | Premium |
|---------|:----:|:-------:|
| Encrypted vault entries | 50 | Unlimited |
| Personal vault | Yes | Yes |
| Encrypted notes (API keys, Wi-Fi, secure text) | 5 | Unlimited |
| Encrypted file attachments | -- | 1 GB |
| Custom categories and tags | 3 custom | Unlimited |
| Password history (previous versions per entry) | -- | Last 25 versions |
| Trash / recently deleted (30-day recovery) | -- | Yes |

### Security & Encryption

| Feature | Free | Premium |
|---------|:----:|:-------:|
| End-to-end encryption (AES-256-GCM + Vault Key) | Yes | Yes |
| Key Derivation Function | PBKDF2 (600k iter) | Argon2id (memory-hard) |
| Recovery key (master password backup) | -- | Yes |
| Vault health report | Score only | Full breakdown + suggestions |
| Breach monitoring (HaveIBeenPwned) | -- | Continuous + email alerts |
| 2FA for Lockr account (TOTP) | Yes | Yes |
| 2FA for Lockr account (FIDO2 / hardware keys) | -- | Yes |

### Convenience & Productivity

| Feature | Free | Premium |
|---------|:----:|:-------:|
| Password generator | Basic | Advanced (passphrase, rules) |
| Built-in TOTP authenticator | -- | Yes |
| Browser extension | Yes | Yes |
| Active sessions / devices | 2 | Unlimited |
| Autofill | Yes | Yes |
| Secure sharing (one-to-one with another Lockr user) | -- | 5 active shares |
| Import from other password managers | Yes | Yes |
| Export vault (encrypted backup) | Yes | Yes |

### Support

| Feature | Free | Premium |
|---------|:----:|:-------:|
| Community support | Yes | Yes |
| Email support | -- | Priority |
| Early access to new features | -- | Yes |

### Future: Family Plan

| Feature | Family |
|---------|:------:|
| Up to 6 members | Yes |
| Shared collections with per-member permissions | Yes |
| Emergency access (trusted contact, time-delayed) | Yes |
| Family admin dashboard | Yes |
| Activity log for shared vaults | Yes |

---

## What the Server Stores vs. What It Knows

This is the zero-knowledge guarantee.

| Data | Stored on Server | Server Can Read It |
|------|:---:|:---:|
| Email, name | Yes | Yes |
| Account password (bcrypt hash) | Yes | No (hashed) |
| Master password | **No** | **Never sent** |
| Vault salt | Yes | Yes (not secret, per-user randomness) |
| KDF parameters | Yes | Yes (not secret, algorithm config) |
| Auth Key hash | Yes | Yes (used for verification, cannot reverse to MEK) |
| Wrapped Vault Key | Yes | No (encrypted with MEK) |
| Recovery Vault Key blob | Yes | No (encrypted with recovery key) |
| Encrypted entry blobs | Yes | No (encrypted with VK) |
| Entry metadata (service name, username, notes) | **No** (inside encrypted blob) | No |
| Public key (for future sharing) | Yes | Yes (public by design) |
| Wrapped private key | Yes | No (encrypted with MEK) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Client-side crypto | Web Crypto API (SubtleCrypto) -- native, no polyfills |
| Premium KDF | Argon2id via WASM (hash-wasm) |
| Authentication | better-auth (session-based, secure cookies) |
| Database | PostgreSQL (via Drizzle ORM) |
| Email | Resend |
| Deployment | Vercel (frontend) + managed PostgreSQL |
| Payments | Stripe (future) |

---

## Security Properties

1. **End-to-end encrypted** -- the server stores only ciphertext and cannot decrypt vault contents
2. **Zero-knowledge authentication** -- the server verifies an Auth Key derivative, never the master password itself
3. **Per-user salt** -- identical master passwords produce different keys for different users
4. **Authenticated encryption** -- AES-256-GCM provides both confidentiality and integrity (tamper detection)
5. **Key hierarchy** -- master password change is O(1), not O(n) entries
6. **Memory-only key storage** -- VK and MEK live in JavaScript memory, not localStorage, not cookies, not IndexedDB
7. **Forward secrecy on lock** -- when the vault is locked, key material is zeroed; re-entry of master password is required to decrypt again
