import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { useVaultStore } from "@/crypto/store";
import {
  deriveMEKBits,
  importMEKForWrapping,
  generateSalt,
  type KdfParams,
  PBKDF2_DEFAULT,
} from "@/crypto/kdf";
import { generateVaultKey, wrapVaultKey, unwrapVaultKey } from "@/crypto/vault-key";
import {
  encryptEntry,
  decryptEntry,
  toBase64,
  fromBase64,
  type VaultEntry,
} from "@/crypto/entry-crypto";
import { deriveAuthKeyHash } from "@/crypto/auth-key";

export interface DecryptedItem {
  id: string;
  entry: VaultEntry;
  createdAt: string;
  updatedAt: string;
}

export interface VaultMetadata {
  vault_salt: string | null;
  encrypted_vault_key: string | null;
  auth_key_hash: string | null;
  kdf_params: KdfParams | null;
  vault_initialized: boolean;
  tier: string;
}

// -- API helpers --

async function fetchVaultMetadata(): Promise<VaultMetadata> {
  const res = await fetch("/api/vault/unlock");
  if (!res.ok) throw new Error("Failed to fetch vault metadata");
  return res.json();
}

async function fetchEntries(): Promise<
  { id: string; encrypted_blob: string; createdAt: string; updatedAt: string }[]
> {
  const res = await fetch("/api/vault/entries");
  if (!res.ok) throw new Error("Failed to fetch entries");
  const data = await res.json();
  return data.entries;
}

async function postVaultSetup(body: {
  vault_salt: string;
  encrypted_vault_key: string;
  auth_key_hash: string;
  kdf_params: KdfParams;
}) {
  const res = await fetch("/api/vault/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Setup failed");
  }
}

async function postEntry(encrypted_blob: string): Promise<{ id: string }> {
  const res = await fetch("/api/vault/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_blob }),
  });
  if (res.status === 403) throw new Error("Entry limit reached");
  if (!res.ok) throw new Error("Failed to save entry");
  return res.json();
}

async function putEntry(id: string, encrypted_blob: string) {
  const res = await fetch(`/api/vault/entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_blob }),
  });
  if (!res.ok) throw new Error("Failed to update entry");
}

async function deleteEntryApi(id: string) {
  const res = await fetch(`/api/vault/entries/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete entry");
}

// -- Hook --

export function useVault() {
  const vaultKey = useVaultStore((s) => s.vaultKey);
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const setVaultKey = useVaultStore((s) => s.setVaultKey);
  const clearKeys = useVaultStore((s) => s.clearKeys);

  const [items, setItems] = React.useState<DecryptedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [vaultMeta, setVaultMeta] = React.useState<VaultMetadata | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState("");
  const [userTier, setUserTier] = React.useState("free");
  const [saving, setSaving] = React.useState(false);

  // Load vault metadata on mount
  React.useEffect(() => {
    (async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data) return;
        setUserName(session.data.user.name || "");

        const meta = await fetchVaultMetadata();
        setVaultMeta(meta);
        setUserTier(meta.tier);
      } catch {
        setError("Failed to load vault");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load and decrypt entries when vault is unlocked
  React.useEffect(() => {
    if (!isUnlocked || !vaultKey) return;

    (async () => {
      try {
        const rawEntries = await fetchEntries();
        const decrypted: DecryptedItem[] = [];

        for (const raw of rawEntries) {
          const blob = fromBase64(raw.encrypted_blob);
          const entry = await decryptEntry(blob, vaultKey);
          decrypted.push({
            id: raw.id,
            entry,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          });
        }

        setItems(decrypted);
      } catch {
        setError("Failed to decrypt entries");
      }
    })();
  }, [isUnlocked, vaultKey]);

  const handleSetup = React.useCallback(
    async (masterPassword: string) => {
      const salt = generateSalt();
      const kdfParams = PBKDF2_DEFAULT;

      const mekBits = await deriveMEKBits(masterPassword, salt, kdfParams);
      const mekWrapping = await importMEKForWrapping(mekBits);
      const vk = await generateVaultKey();
      const wrappedVK = await wrapVaultKey(vk, mekWrapping);
      const authHash = await deriveAuthKeyHash(mekBits);

      await postVaultSetup({
        vault_salt: toBase64(salt),
        encrypted_vault_key: toBase64(wrappedVK),
        auth_key_hash: authHash,
        kdf_params: kdfParams,
      });

      setVaultKey(vk);
      setVaultMeta((prev) => (prev ? { ...prev, vault_initialized: true } : prev));
    },
    [setVaultKey]
  );

  const handleUnlock = React.useCallback(
    async (masterPassword: string) => {
      if (!vaultMeta?.vault_salt || !vaultMeta.encrypted_vault_key || !vaultMeta.kdf_params || !vaultMeta.auth_key_hash) {
        throw new Error("Vault metadata missing");
      }

      const salt = fromBase64(vaultMeta.vault_salt);
      const mekBits = await deriveMEKBits(masterPassword, salt, vaultMeta.kdf_params);
      const authHash = await deriveAuthKeyHash(mekBits);

      if (authHash !== vaultMeta.auth_key_hash) {
        throw new Error("Wrong master password");
      }

      const mekWrapping = await importMEKForWrapping(mekBits);
      const wrappedVK = fromBase64(vaultMeta.encrypted_vault_key);
      const vk = await unwrapVaultKey(wrappedVK, mekWrapping);

      setVaultKey(vk);
    },
    [vaultMeta, setVaultKey]
  );

  const addEntry = React.useCallback(
    async (data: VaultEntry) => {
      if (!vaultKey) return;
      setSaving(true);
      try {
        const blob = await encryptEntry(data, vaultKey);
        const { id } = await postEntry(toBase64(blob));
        setItems((prev) => [
          { id, entry: data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ...prev,
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add entry");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [vaultKey]
  );

  const editEntry = React.useCallback(
    async (entryId: string, data: VaultEntry) => {
      if (!vaultKey) return;
      setSaving(true);
      try {
        const blob = await encryptEntry(data, vaultKey);
        await putEntry(entryId, toBase64(blob));
        setItems((prev) =>
          prev.map((it) =>
            it.id === entryId
              ? { ...it, entry: data, updatedAt: new Date().toISOString() }
              : it
          )
        );
      } catch {
        setError("Failed to update entry");
      } finally {
        setSaving(false);
      }
    },
    [vaultKey]
  );

  const deleteEntry = React.useCallback(async (entryId: string) => {
    try {
      await deleteEntryApi(entryId);
      setItems((prev) => prev.filter((it) => it.id !== entryId));
    } catch {
      setError("Failed to delete entry");
    }
  }, []);

  const lock = React.useCallback(() => {
    clearKeys();
    setItems([]);
  }, [clearKeys]);

  const isSetup = vaultMeta ? !vaultMeta.vault_initialized : true;

  return {
    items,
    loading,
    error,
    setError,
    saving,
    userName,
    userTier,
    isUnlocked,
    isSetup,
    handleSetup,
    handleUnlock,
    addEntry,
    editEntry,
    deleteEntry,
    lock,
  };
}
