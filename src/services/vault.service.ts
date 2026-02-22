import { db } from "@/db/drizzle";
import { user, entries } from "@/db/schema";
import { eq, count, sql, and } from "drizzle-orm";

function base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}

function bufferToBase64(buf: Buffer): string {
  return buf.toString("base64");
}

export async function initializeVault(
  userId: string,
  data: {
    vault_salt: string;
    encrypted_vault_key: string;
    auth_key_hash: string;
    kdf_params: object;
  }
) {
  const [existing] = await db
    .select({ vaultInitialized: user.vaultInitialized })
    .from(user)
    .where(eq(user.id, userId));

  if (existing?.vaultInitialized) {
    throw new Error("Vault already initialized");
  }

  await db
    .update(user)
    .set({
      vaultSalt: base64ToBuffer(data.vault_salt),
      encryptedVaultKey: base64ToBuffer(data.encrypted_vault_key),
      authKeyHash: data.auth_key_hash,
      kdfParams: data.kdf_params,
      vaultInitialized: true,
    })
    .where(eq(user.id, userId));
}

export async function getVaultMetadata(userId: string) {
  const [row] = await db
    .select({
      vaultSalt: user.vaultSalt,
      encryptedVaultKey: user.encryptedVaultKey,
      authKeyHash: user.authKeyHash,
      kdfParams: user.kdfParams,
      vaultInitialized: user.vaultInitialized,
      tier: user.tier,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!row) return null;

  return {
    vault_salt: row.vaultSalt ? bufferToBase64(row.vaultSalt) : null,
    encrypted_vault_key: row.encryptedVaultKey
      ? bufferToBase64(row.encryptedVaultKey)
      : null,
    auth_key_hash: row.authKeyHash,
    kdf_params: row.kdfParams,
    vault_initialized: row.vaultInitialized,
    tier: row.tier,
  };
}

export async function getEntries(userId: string) {
  const rows = await db
    .select({
      id: entries.id,
      encryptedBlob: entries.encryptedBlob,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
    })
    .from(entries)
    .where(eq(entries.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    encrypted_blob: bufferToBase64(row.encryptedBlob),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function createEntry(userId: string, encryptedBlob: string) {
  const [tierRow] = await db
    .select({ tier: user.tier })
    .from(user)
    .where(eq(user.id, userId));

  const [countRow] = await db
    .select({ count: count() })
    .from(entries)
    .where(eq(entries.userId, userId));

  if (tierRow.tier === "free" && countRow.count >= 50) {
    throw new Error("Entry limit reached");
  }

  const [inserted] = await db
    .insert(entries)
    .values({
      userId,
      encryptedBlob: base64ToBuffer(encryptedBlob),
    })
    .returning({ id: entries.id });

  return { id: inserted.id };
}

export async function updateEntry(
  userId: string,
  entryId: string,
  encryptedBlob: string
) {
  const result = await db
    .update(entries)
    .set({
      encryptedBlob: base64ToBuffer(encryptedBlob),
      updatedAt: sql`now()`,
    })
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .returning({ id: entries.id });

  if (result.length === 0) {
    throw new Error("Entry not found");
  }
}

export async function deleteEntry(userId: string, entryId: string) {
  const result = await db
    .delete(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .returning({ id: entries.id });

  if (result.length === 0) {
    throw new Error("Entry not found");
  }
}

export async function rotateKey(
  userId: string,
  data: {
    vault_salt: string;
    encrypted_vault_key: string;
    auth_key_hash: string;
    kdf_params: object;
  }
) {
  const vaultSalt = base64ToBuffer(data.vault_salt);
  const encryptedVaultKey = base64ToBuffer(data.encrypted_vault_key);

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({
        vaultSalt,
        encryptedVaultKey,
        authKeyHash: data.auth_key_hash,
        kdfParams: data.kdf_params,
      })
      .where(eq(user.id, userId));
  });
}

export async function upgradeVault(
  userId: string,
  data: {
    encrypted_vault_key: string;
    recovery_vault_key?: string;
    auth_key_hash: string;
    kdf_params: object;
  }
) {
  const updateData: Record<string, unknown> = {
    encryptedVaultKey: base64ToBuffer(data.encrypted_vault_key),
    authKeyHash: data.auth_key_hash,
    kdfParams: data.kdf_params,
  };

  if (data.recovery_vault_key) {
    updateData.recoveryVaultKey = base64ToBuffer(data.recovery_vault_key);
  }

  await db.update(user).set(updateData).where(eq(user.id, userId));
}
