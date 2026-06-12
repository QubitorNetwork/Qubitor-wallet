// Quanta Wallet desktop — native key vault.
//
// The frontend (the shared Expo web export) calls these commands through
// @qubitor/keystore's desktop KeyVault. Values are already passcode-encrypted
// by @qubitor/pq-crypto before they ever reach Rust; this layer only provides
// OS-protected at-rest storage (macOS Keychain / Windows Credential Manager /
// Linux Secret Service) keyed by the wallet's storage keys.
//
// Strict Snap confinement does not reliably allow direct Secret Service access
// without a privileged manual interface connection. For Snap builds we store the
// already-encrypted profile records under $SNAP_USER_DATA instead. The plaintext
// ML-DSA key never reaches this layer.

use keyring::Entry;
use std::{
    env, fs,
    io::ErrorKind,
    path::{Path, PathBuf},
};

const SERVICE: &str = "quanta.wallet.mldsa65.profile";

fn entry(key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, key).map_err(|e| e.to_string())
}

fn snap_vault_dir() -> Option<PathBuf> {
    env::var_os("SNAP_USER_DATA")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .map(|base| base.join("vault").join(SERVICE))
}

fn snap_vault_active() -> bool {
    snap_vault_dir().is_some()
}

fn key_file_name(key: &str) -> Result<String, String> {
    if key.is_empty() {
        return Err("vault key cannot be empty".to_string());
    }

    let mut encoded = String::with_capacity(key.len() * 2 + 5);
    for byte in key.as_bytes() {
        use std::fmt::Write as _;
        write!(&mut encoded, "{byte:02x}").map_err(|e| e.to_string())?;
    }
    encoded.push_str(".json");
    Ok(encoded)
}

fn snap_vault_path(key: &str) -> Result<Option<PathBuf>, String> {
    snap_vault_dir()
        .map(|dir| key_file_name(key).map(|file| dir.join(file)))
        .transpose()
}

fn ensure_private_dir(dir: &Path) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn snap_vault_get(key: &str) -> Result<Option<String>, String> {
    let Some(path) = snap_vault_path(key)? else {
        return Ok(None);
    };

    match fs::read_to_string(path) {
        Ok(value) => Ok(Some(value)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

fn snap_vault_set(key: &str, value: &str) -> Result<bool, String> {
    let Some(path) = snap_vault_path(key)? else {
        return Ok(false);
    };

    let dir = path
        .parent()
        .ok_or_else(|| "snap vault path has no parent directory".to_string())?;
    ensure_private_dir(dir)?;

    let tmp = path.with_extension("tmp");
    fs::write(&tmp, value.as_bytes()).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&tmp, fs::Permissions::from_mode(0o600)).map_err(|e| e.to_string())?;
    }
    fs::rename(tmp, path).map_err(|e| e.to_string())?;
    Ok(true)
}

fn snap_vault_delete(key: &str) -> Result<bool, String> {
    let Some(path) = snap_vault_path(key)? else {
        return Ok(false);
    };

    match fs::remove_file(path) {
        Ok(()) => Ok(true),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(true),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn vault_get(key: String) -> Result<Option<String>, String> {
    if snap_vault_active() {
        return snap_vault_get(&key);
    }

    match entry(&key)?.get_password() {
        Ok(v) => Ok(Some(v)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn vault_set(key: String, value: String) -> Result<(), String> {
    if snap_vault_set(&key, &value)? {
        return Ok(());
    }

    entry(&key)?.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn vault_delete(key: String) -> Result<(), String> {
    if snap_vault_delete(&key)? {
        return Ok(());
    }

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
