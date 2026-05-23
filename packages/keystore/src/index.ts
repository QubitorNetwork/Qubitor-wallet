/**
 * @qubitor/keystore — platform-neutral key-storage seam.
 *
 * The wallet's encrypted ML-DSA profile blob is read/written through a single
 * `KeyVault` interface. Each platform registers its own implementation at
 * startup:
 *
 *   - mobile  → expo-secure-store (OS Keychain / Keystore)         [apps/mobile]
 *   - desktop → Tauri Stronghold (encrypted vault file)            [apps/desktop]
 *   - plain web preview → localStorage (NOT secure; dev only)      [default here]
 *
 * Values are opaque strings (already-encrypted JSON produced by
 * @qubitor/pq-crypto). This package never imports RN/Expo/Tauri so it stays
 * usable from any runtime.
 */

interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface KeyVault {
  /** Backend name, for diagnostics ("secure-store" | "stronghold" | "local-insecure"). */
  readonly backend: string;
  /** True when the backend encrypts at rest with OS-level protection. */
  readonly secure: boolean;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

/**
 * Default fallback: plain web localStorage (or in-memory if absent).
 * Explicitly NOT secure — only used for web preview where no OS keystore
 * exists. Real platforms override this via registerKeyVault().
 */
function createLocalFallback(): KeyVault {
  const mem = new Map<string, string>();
  const getLocalStorage = () =>
    typeof globalThis !== "undefined"
      ? (globalThis as { localStorage?: WebStorageLike }).localStorage
      : undefined;
  return {
    backend: "local-insecure",
    secure: false,
    async getItem(key) {
      const ls = getLocalStorage();
      return ls ? ls.getItem(key) : (mem.get(key) ?? null);
    },
    async setItem(key, value) {
      const ls = getLocalStorage();
      if (ls) ls.setItem(key, value);
      else mem.set(key, value);
    },
    async deleteItem(key) {
      const ls = getLocalStorage();
      if (ls) ls.removeItem(key);
      else mem.delete(key);
    },
  };
}

let active: KeyVault = createLocalFallback();

/** Register the platform key vault. Call once at app startup, before any
 *  wallet read/write. Idempotent — last registration wins. */
export function registerKeyVault(vault: KeyVault): void {
  active = vault;
}

/** The active key vault. Falls back to insecure local storage until a
 *  platform implementation is registered. */
export function getKeyVault(): KeyVault {
  return active;
}

/** True when the active vault provides OS-level at-rest protection. */
export function isVaultSecure(): boolean {
  return active.secure;
}
