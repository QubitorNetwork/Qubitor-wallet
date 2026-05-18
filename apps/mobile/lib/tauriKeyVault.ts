import type { KeyVault } from "@qubitor/keystore";

// Desktop KeyVault — bridges to the Tauri Rust `vault_*` commands, which store
// the (already passcode-encrypted) profile blob in the OS keychain:
// macOS Keychain / Windows Credential Manager / Linux Secret Service.
//
// This module is only registered when running inside the Tauri shell
// (see app/_layout.tsx). It reaches Tauri via the global injected by
// `app.withGlobalTauri: true` rather than @tauri-apps/api, so the shared
// Expo web bundle needs no Tauri npm dependency.

type TauriInvoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

function invoke(): TauriInvoke {
  const tauri = (globalThis as { __TAURI__?: { core?: { invoke?: TauriInvoke } } }).__TAURI__;
  const fn = tauri?.core?.invoke;
  if (!fn) {
    throw new Error("Tauri invoke bridge unavailable — desktop vault cannot be reached");
  }
  return fn;
}

export const tauriKeyVault: KeyVault = {
  backend: "os-keychain",
  secure: true,
  async getItem(key) {
    return (await invoke()<string | null>("vault_get", { key })) ?? null;
  },
  async setItem(key, value) {
    await invoke()<void>("vault_set", { key, value });
  },
  async deleteItem(key) {
    await invoke()<void>("vault_delete", { key });
  },
};
