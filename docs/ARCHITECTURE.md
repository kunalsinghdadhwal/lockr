# Lockr -- Architecture & Product Overview

## What is Lockr?

Lockr is an end-to-end encrypted password manager built as a SaaS product. The server never has access to user passwords or vault contents in plaintext. All encryption and decryption happens client-side in the browser using the Web Crypto API.

Lockr uses a **vault key architecture** where a randomly generated Vault Key encrypts all entries, and the user's master password protects that Vault Key. This means changing your master password is instant (re-wrap one key) rather than re-encrypting every stored entry.

The entire application -- frontend, API, and middleware -- is a single Next.js deployment. No separate backend service.

---

## System Overview

```mermaid
graph TB
    subgraph Client ["Browser (Client-Side)"]
        UI["React UI<br/>(client components)"]
        WC[Web Crypto API]
        KDF[Key Derivation<br/>PBKDF2 or Argon2id]
        ENC[AES-256-GCM<br/>Encrypt / Decrypt]
        KW[AES-KW<br/>Key Wrap / Unwrap]
        MEM["In-Memory Key Store<br/>(Zustand / module scope)"]
    end

    subgraph NextApp ["Next.js (Single Deployment on Vercel)"]
        subgraph Pages ["App Router (SSR + Client)"]
            LP[Landing Page<br/>SSR -- marketing, SEO]
            AUTH_P[Auth Pages<br/>sign-in, sign-up, reset]
            DASH["Dashboard<br/>'use client' -- vault UI"]
        end

        subgraph API ["API Routes (/api/*)"]
            AV["/api/vault/*<br/>setup, unlock, entries,<br/>rotate-key, upgrade"]
            AA["/api/auth/[...all]<br/>better-auth handler"]
            AW["/api/auth/[...all]<br/>includes Polar<br/>webhook + checkout"]
        end

        subgraph SVC ["Service Layer (framework-agnostic)"]
            VS[vault.service.ts<br/>CRUD encrypted blobs]
            AS[auth helpers<br/>session validation]
            PS[payment.service.ts<br/>tier management]
        end

        MW["middleware.ts<br/>Route protection<br/>Session validation"]
    end

    subgraph DB ["PostgreSQL (Neon)"]
        UT[user]
        ST[session]
        AT[account]
        ET[entries<br/>encrypted blobs]
        VT[verification]
    end

    UI --> WC
    WC --> KDF
    WC --> ENC
    WC --> KW
    KDF --> MEM
    KW --> MEM
    MEM --> ENC

    UI -->|fetch| MW
    MW --> API
    MW --> Pages
    AV --> VS
    AA --> AS
    AW --> PS
    VS --> ET
    AS --> UT
    AS --> ST
    PS --> UT

    style Client fill:#1a1a2e,stroke:#e94560,color:#eee
    style NextApp fill:#16213e,stroke:#0f3460,color:#eee
    style Pages fill:#1a1a2e,stroke:#533483,color:#eee
    style API fill:#1a1a2e,stroke:#533483,color:#eee
    style SVC fill:#1a1a2e,stroke:#533483,color:#eee
    style DB fill:#0f3460,stroke:#533483,color:#eee
```

---

## Project Structure

```
src/
  app/
    (marketing)/
      page.tsx                    -- landing page (SSR, SEO)
      pricing/page.tsx            -- pricing page (SSR, SEO)
    (auth)/
      sign-in/page.tsx
      sign-up/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
      email-verified/page.tsx
    dashboard/
      page.tsx                    -- vault UI ("use client", all crypto here)
    api/
      auth/[...all]/route.ts      -- better-auth catch-all handler
      vault/
        setup/route.ts            -- POST: store salt, wrapped VK, auth hash, kdf_params
        unlock/route.ts           -- GET: return vault metadata for key derivation
        entries/route.ts          -- GET: fetch encrypted blobs, POST: save encrypted blob
        entries/[id]/route.ts     -- PUT: update entry, DELETE: remove entry
        rotate-key/route.ts       -- POST: re-wrap VK on master password change
        upgrade/route.ts          -- POST: swap KDF, add recovery key blob
      # Polar webhooks + checkout handled via better-auth plugin
      # in /api/auth/[...all] -- no separate route needed

  services/
    vault.service.ts              -- vault CRUD logic (framework-agnostic)
    payment.service.ts            -- tier management, Polar onPayload handler

  crypto/                         -- client-side only, imported by dashboard
    kdf.ts                        -- PBKDF2 + Argon2id wrappers (Web Crypto API)
    vault-key.ts                  -- VK generation, AES-KW wrap/unwrap
    entry-crypto.ts               -- AES-256-GCM encrypt/decrypt entry blobs
    auth-key.ts                   -- HKDF derivation of auth key from MEK
    recovery.ts                   -- recovery key generation + VK wrapping (premium)
    store.ts                      -- in-memory key store (Zustand or module scope)

  db/
    schema.ts                     -- Drizzle schema (all tables)
    drizzle.ts                    -- database connection
    migrations/                   -- Drizzle Kit generated SQL

  lib/
    auth.ts                       -- better-auth server config
    auth-client.ts                -- better-auth client
    resend.ts                     -- email service
    zod.ts                        -- shared validation schemas
    utils.ts

  middleware.ts                   -- route protection, session checks

  components/
    ui/                           -- shadcn/ui primitives
    ...                           -- app-specific components
```

**Key design rule:** API route files (`route.ts`) are thin handlers -- they parse the request, call a function in `services/`, and return a response. All business logic lives in `services/`. This keeps the door open for extracting to a separate backend later if a mobile app or browser extension is added.

---

## API Routes

All routes are Next.js API route handlers under `src/app/api/`.

| Method | Route | Auth Required | Purpose |
|--------|-------|:---:|---------|
| `*` | `/api/auth/[...all]` | No | better-auth handler (sign-up, sign-in, OAuth, email verify, password reset) |
| `POST` | `/api/vault/setup` | Yes | First-time vault init: store salt, wrapped VK, auth key hash, KDF params |
| `GET` | `/api/vault/unlock` | Yes | Return vault_salt, encrypted_vault_key, kdf_params, auth_key_hash |
| `GET` | `/api/vault/entries` | Yes | Fetch all encrypted entry blobs for the authenticated user |
| `POST` | `/api/vault/entries` | Yes | Save a new encrypted entry blob |
| `PUT` | `/api/vault/entries/[id]` | Yes | Update an existing encrypted entry blob |
| `DELETE` | `/api/vault/entries/[id]` | Yes | Delete an entry |
| `POST` | `/api/vault/rotate-key` | Yes | Master password change: store new wrapped VK + auth key hash |
| `POST` | `/api/vault/upgrade` | Yes | Tier upgrade: swap KDF params, add recovery vault key blob |
| `POST` | `/api/auth/[...all]` (Polar webhook path) | No (Polar signature) | Subscription created, updated, canceled events (handled by better-auth Polar plugin) |

Session validation on "Auth Required" routes: middleware extracts the session cookie, verifies it against the `session` table, and injects the authenticated `userId` into the request. The API route handler never trusts a client-sent `userId` -- it always uses the session-verified identity.

---

## Database Schema

```mermaid
erDiagram
    user {
        text id PK
        text name
        text email UK
        boolean emailVerified
        text image
        text role
        text tier "free | premium"
        bytea vault_salt "per-user, 32 bytes"
        bytea encrypted_vault_key "VK wrapped with MEK"
        bytea recovery_vault_key "VK wrapped with recovery key (premium)"
        text auth_key_hash "SHA-256 hash of derived Auth Key (hex)"
        jsonb kdf_params "algo, iterations, memory, parallelism"
        boolean vault_initialized "false until first setup"
        timestamp createdAt
        timestamp updatedAt
    }

    session {
        text id PK
        text token UK
        timestamp expiresAt
        text ipAddress
        text userAgent
        text userId FK
        timestamp createdAt
        timestamp updatedAt
    }

    account {
        text id PK
        text accountId
        text providerId
        text userId FK
        text password "bcrypt hash (email/password provider)"
        text accessToken
        text refreshToken
        timestamp createdAt
        timestamp updatedAt
    }

    entries {
        uuid id PK
        text userId FK
        bytea encrypted_blob "packed binary: IV (12B) | ciphertext | auth tag (16B)"
        timestamp createdAt
        timestamp updatedAt
    }

    verification {
        text id PK
        text identifier
        text value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }

    user ||--o{ session : has
    user ||--o{ account : has
    user ||--o{ entries : owns
    user ||--o{ verification : has
```

**What changed from the current schema:** the `passwords` table (with plaintext `username`, `serviceName`, `notes` columns) is replaced by `entries` with a single opaque `encrypted_blob` column. All metadata lives inside the encrypted blob -- the server cannot read any of it.

### Storage Encoding

All binary data (`vault_salt`, `encrypted_vault_key`, `recovery_vault_key`, `encrypted_blob`) is stored as PostgreSQL `BYTEA` -- raw bytes, no encoding overhead on disk. The `auth_key_hash` is stored as `TEXT` (hex-encoded SHA-256 hash) since it is used for string comparison on the server.

For API transport (JSON responses/requests), binary fields are base64-encoded. The base64 overhead (33%) exists only in transit, not at rest.

**Encrypted blob binary layout** (no delimiters, fixed-position fields):

```
| IV (12 bytes) | Ciphertext (variable) + Auth Tag (16 bytes, appended by Web Crypto) |
|---------------|----------------------------------------------------------------------|
| Fixed offset  | crypto.subtle.encrypt output (ciphertext + tag concatenated)         |
```

On decrypt, slice the first 12 bytes as IV, pass the remainder to `crypto.subtle.decrypt` which expects ciphertext + appended auth tag.

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
    participant N as Next.js (API Routes)
    participant DB as PostgreSQL

    U->>U: Enter email, account password, master password
    U->>N: POST /api/auth/sign-up (email + account password)
    N->>DB: Create user record (tier=free, vault_initialized=false), hash account password (bcrypt)
    N-->>U: Account created, verification email sent via Resend
    U->>U: Click verification link in email

    Note over U: First-time vault setup (runs in browser)
    U->>U: Generate random salt (32 bytes) via crypto.getRandomValues
    U->>U: Derive MEK = PBKDF2(master_password, salt, 600k iter)
    U->>U: Derive Auth Key = HKDF(MEK, "lockr-auth")
    U->>U: Generate random Vault Key (256-bit) via crypto.getRandomValues
    U->>U: Wrap VK with MEK using AES-KW

    U->>N: POST /api/vault/setup (session cookie)
    Note right of U: { vault_salt: base64, encrypted_vault_key: base64,<br/>auth_key_hash: hex(SHA-256(Auth Key)),<br/>kdf_params: {algo:"pbkdf2", iter:600000} }
    N->>N: Validate session cookie, extract userId
    N->>N: Decode base64 fields to Buffer for BYTEA storage
    N->>DB: UPDATE user SET vault_salt, encrypted_vault_key, auth_key_hash, kdf_params, vault_initialized=true
    N-->>U: 200 OK -- vault initialized

    Note over U: If Premium: also generate recovery key,<br/>wrap VK with recovery key, include recovery_vault_key in request
```

---

## Unlock & Decrypt Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Next.js (API Routes)
    participant DB as PostgreSQL

    U->>N: GET /api/vault/unlock (session cookie)
    N->>N: Validate session, extract userId
    N->>DB: SELECT vault_salt, kdf_params, encrypted_vault_key, auth_key_hash FROM user
    N->>N: Encode BYTEA fields to base64 for JSON response
    N-->>U: Return vault metadata (salt + wrapped VK as base64, auth hash as hex)

    U->>U: Enter master password
    U->>U: Derive MEK from master password + salt (per kdf_params)
    U->>U: Derive Auth Key = HKDF(MEK, "lockr-auth")
    U->>U: Compare SHA-256(Auth Key) with received auth_key_hash

    alt Auth Key hash matches
        U->>U: Unwrap VK from encrypted_vault_key using MEK (AES-KW)
        U->>U: Store VK in memory (Zustand store / module variable)
        U->>N: GET /api/vault/entries (session cookie)
        N->>N: Validate session, extract userId
        N->>DB: SELECT id, encrypted_blob, createdAt, updatedAt FROM entries WHERE userId = $1
        N->>N: Encode each BYTEA blob to base64 for JSON response
        N-->>U: Return array of { id, encrypted_blob: base64, createdAt, updatedAt }
        U->>U: Decrypt each blob with VK (AES-256-GCM)
        U->>U: Display plaintext entries in UI
    else Auth Key hash does not match
        U->>U: Show "Wrong master password" error
    end

    Note over U: On lock / logout: zero VK from memory,<br/>clear Zustand store
```

---

## Save Entry Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Next.js (API Routes)
    participant DB as PostgreSQL

    U->>U: Fill form: service name, username, password, notes, category
    U->>U: Build JSON: { serviceName, username, password, notes, category }
    U->>U: Generate random 12-byte IV via crypto.getRandomValues
    U->>U: Encrypt JSON blob with VK using AES-256-GCM
    U->>U: Pack into binary: IV (12B) | ciphertext | auth tag (16B)
    U->>U: Encode packed blob as base64 for JSON transport

    U->>N: POST /api/vault/entries (session cookie)
    Note right of U: { encrypted_blob: "base64(packed binary)" }
    N->>N: Validate session cookie, extract userId
    N->>N: Check entry count against tier limit (free = 50)
    N->>N: Decode base64 to Buffer for BYTEA storage
    N->>DB: INSERT INTO entries (id, userId, encrypted_blob)
    N-->>U: 201 Created { id }
```

---

## Master Password Change Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Next.js (API Routes)

    U->>U: Enter current master password
    U->>U: Derive old MEK, verify Auth Key hash, unwrap VK

    U->>U: Enter new master password
    U->>U: Generate new salt (32 bytes)
    U->>U: Derive new MEK from new password + new salt
    U->>U: Derive new Auth Key = HKDF(new MEK, "lockr-auth")
    U->>U: Re-wrap VK with new MEK (AES-KW)

    U->>N: POST /api/vault/rotate-key (session cookie)
    Note right of U: { vault_salt: base64, encrypted_vault_key: base64,<br/>auth_key_hash: hex, kdf_params }
    N->>N: Validate session
    N->>N: Update user record atomically (transaction)
    N-->>U: 200 OK

    Note over U: Zero entries re-encrypted.<br/>VK is unchanged. Only the wrapping changed.
```

---

## Tier Upgrade Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Next.js (API Routes)
    participant D as Polar

    U->>D: Checkout session (Polar hosted page via authClient.polar.checkoutSession)
    D-->>N: POST /api/auth/[...all] (webhook: subscription.created)
    N->>N: Verify Polar webhook signature (better-auth plugin)
    N->>N: UPDATE user SET tier = 'premium'

    Note over U: Next time user unlocks vault
    U->>N: GET /api/vault/unlock (session cookie)
    N-->>U: vault metadata + tier = "premium"

    U->>U: Enter master password
    U->>U: Derive old MEK (PBKDF2), unwrap VK

    U->>U: Re-derive MEK with Argon2id (new KDF)
    U->>U: Derive new Auth Key from new MEK
    U->>U: Re-wrap VK with new MEK
    U->>U: Generate Recovery Key (random 256-bit, display as base58 string)
    U->>U: Wrap VK with Recovery Key

    U->>N: POST /api/vault/upgrade (session cookie)
    Note right of U: { encrypted_vault_key: base64, recovery_vault_key: base64,<br/>auth_key_hash: hex, kdf_params:{algo:"argon2id",...} }
    N-->>U: 200 OK

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
| Browser extension (future) | Yes | Yes |
| Active sessions / devices | 2 | Unlimited |
| Autofill (future) | Yes | Yes |
| Secure sharing (one-to-one, future) | -- | 5 active shares |
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
| Auth Key hash | Yes | Yes (verification only, cannot reverse to MEK) |
| Wrapped Vault Key | Yes | No (encrypted with MEK) |
| Recovery Vault Key blob | Yes | No (encrypted with recovery key) |
| Encrypted entry blobs | Yes | No (encrypted with VK) |
| Entry metadata (service name, username, notes) | **No** (inside encrypted blob) | No |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) -- single deployment for UI + API |
| UI | React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui, Radix |
| Forms | react-hook-form + zod |
| Data fetching | TanStack Query (React Query) |
| Client state (key store) | Zustand (in-memory only, never persisted) |
| URL state | nuqs (type-safe search params -- filters, categories, pagination) |
| Client-side crypto | Web Crypto API (SubtleCrypto) -- native, no polyfills |
| Premium KDF | Argon2id via WASM (hash-wasm), dynamically imported |
| Authentication | better-auth (session-based, secure httpOnly cookies) |
| Database | PostgreSQL on Neon (serverless, connection pooling) |
| ORM | Drizzle ORM + Drizzle Kit (migrations) |
| Validation | zod (shared between client and API routes) |
| Email | Resend + React Email templates |
| Payments | Polar (better-auth plugin -- checkout, customer portal, webhooks, tax compliance) |
| Hosting | Vercel (single deployment) |
| Monitoring | Sentry (errors), PostHog (privacy-friendly analytics) |
| Testing | Vitest (unit/crypto), Playwright (E2E) |

---

## Security Properties

1. **End-to-end encrypted** -- the server stores only ciphertext and cannot decrypt vault contents
2. **Zero-knowledge authentication** -- the server verifies an Auth Key derivative, never the master password itself
3. **Per-user salt** -- identical master passwords produce different keys for different users
4. **Authenticated encryption** -- AES-256-GCM provides both confidentiality and integrity (tamper detection)
5. **Key hierarchy** -- master password change is O(1), not O(n) entries
6. **Memory-only key storage** -- VK and MEK live in JavaScript memory (Zustand store), never in localStorage, cookies, or IndexedDB
7. **Forward secrecy on lock** -- when the vault is locked, key material is zeroed; re-entry of master password is required to decrypt again
8. **Server-side session validation** -- API routes never trust client-sent userId; identity is always extracted from the validated session cookie
9. **Tier-enforced limits** -- entry count limits are enforced server-side, not client-side
