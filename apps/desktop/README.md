# @qubitor/desktop — Quanta Wallet (desktop)

Tauri v2 shell that wraps the shared Expo `react-native-web` static export
(`apps/mobile`) into native desktop apps for **macOS, Windows, and Ubuntu**.

The wallet UI, the real Qubitor RPC client, ML-DSA-65 signing and
`@qubitor/pq-crypto` passcode encryption are all the same code that ships in
the mobile app — only the key-at-rest layer differs.

## Key storage (standalone)

The desktop app owns its own ML-DSA key. The passcode-encrypted profile blob is
written to the OS keychain via the Rust `vault_get/vault_set/vault_delete`
commands ([src-tauri/src/lib.rs](src-tauri/src/lib.rs)):

| OS      | Backend                       |
|---------|-------------------------------|
| macOS   | Keychain                      |
| Windows | Credential Manager            |
| Linux   | Secret Service (libsecret)    |
| Snap    | `$SNAP_USER_DATA` encrypted blob store |

Snap builds run under strict confinement. Instead of requiring the privileged
`password-manager-service` interface, the Tauri vault stores the already
passcode-encrypted wallet records in the snap's private user data directory.
Non-Snap Linux builds continue to use Secret Service.

The frontend reaches these through `@qubitor/keystore`'s desktop `KeyVault`
([apps/mobile/lib/tauriKeyVault.ts](../mobile/lib/tauriKeyVault.ts)), selected
at startup in `apps/mobile/app/_layout.tsx` when `__TAURI_INTERNALS__` is
present.

> **Security note.** A desktop process is more exposed than a phone secure
> enclave. This standalone keystore is gated on a desktop-specific security
> review before any mainnet use — see [docs/PUBLISHING.md](../../docs/PUBLISHING.md).

## Prerequisites

- Rust (stable) + Cargo
- Node ≥ 20, pnpm 10.18.2
- Linux build deps: `webkit2gtk-4.1`, `libsecret`, `libdbus-1`, `pkg-config`, `librsvg2`, build-essential
  (Ubuntu 22.04 / 24.04 — see PUBLISHING.md for the supported matrix)

## Local development

```sh
pnpm install
pnpm --filter @qubitor/desktop dev      # builds the web export, opens the app
```

## Build installers

```sh
pnpm --filter @qubitor/desktop build
```

Produces (per host OS): `.dmg`/`.app` (macOS), `.msi` + NSIS `.exe` (Windows),
`.AppImage` + `.deb` (Linux). Output: `src-tauri/target/release/bundle/`.

`beforeBuildCommand` runs `pnpm --filter @qubitor/mobile build:web` first, so
the bundled frontend is always a fresh `apps/mobile/dist` export.

## Build the Ubuntu Store snap

The root [`snapcraft.yaml`](../../snapcraft.yaml) wraps the Tauri `.deb` bundle
into a strict Snap package:

```sh
sudo snap install snapcraft --classic
snapcraft
sudo snap install ./quanta-wallet_0.0.24_amd64.snap --dangerous
quanta-wallet
```

Publishing is handled by the manual
[`Snapcraft`](../../.github/workflows/snapcraft.yml) workflow once
`SNAPCRAFT_STORE_CREDENTIALS` is configured in GitHub secrets.

## Icons

`src-tauri/icons/icon.png` is seeded from `apps/mobile/assets/icon.png`.
Regenerate the full platform icon set (`.icns`, `.ico`, sized PNGs) with:

```sh
pnpm --filter @qubitor/desktop gen:icons
```

## Releases

CI builds the macOS/Windows/Ubuntu installers on a `v*` tag — see
[.github/workflows/release.yml](../../.github/workflows/release.yml). Releases
are **unsigned** until signing certs are supplied (expect Gatekeeper /
SmartScreen warnings); details in [docs/PUBLISHING.md](../../docs/PUBLISHING.md).
