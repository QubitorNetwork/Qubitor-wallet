// Quanta Wallet desktop — OS-keychain-backed key vault.
//
// The frontend (the shared Expo web export) calls these commands through
// @qubitor/keystore's desktop KeyVault. Values are already passcode-encrypted
// by @qubitor/pq-crypto before they ever reach Rust; this layer only provides
// OS-protected at-rest storage (macOS Keychain / Windows Credential Manager /
// Linux Secret Service) keyed by the wallet's storage keys.

use keyring::Entry;

const SERVICE: &str = "quanta.wallet.mldsa65.profile";

fn entry(key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, key).map_err(|e| e.to_string())
}

#[tauri::command]
fn vault_get(key: String) -> Result<Option<String>, String> {
    match entry(&key)?.get_password() {
        Ok(v) => Ok(Some(v)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn vault_set(key: String, value: String) -> Result<(), String> {
    entry(&key)?.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn vault_delete(key: String) -> Result<(), String> {
    match entry(&key)?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![vault_get, vault_set, vault_delete])
        .run(tauri::generate_context!())
        .expect("error while running Quanta Wallet desktop");
}
