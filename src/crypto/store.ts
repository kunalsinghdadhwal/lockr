import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export interface VaultStore {
  vaultKey: CryptoKey | null;
  isUnlocked: boolean;
  setVaultKey: (key: CryptoKey) => void;
  clearKeys: () => void;
}

export const vaultStore = createStore<VaultStore>()((set) => ({
  vaultKey: null,
  isUnlocked: false,

  setVaultKey: (key: CryptoKey) =>
    set({ vaultKey: key, isUnlocked: true }),

  clearKeys: () =>
    set({ vaultKey: null, isUnlocked: false }),
}));

export function useVaultStore<T>(selector: (state: VaultStore) => T): T {
  return useStore(vaultStore, selector);
}
