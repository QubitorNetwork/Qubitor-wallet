# Publishing — Quanta Wallet

Status: **NOT mainnet-ready.** This checklist is the path from the current
testnet-capable prototype to (a) a labelled testnet beta and (b) a public
release. Items are ordered; do not skip the blockers.

## Scope decision (do this first)

Quanta Wallet currently runs on **Qubitor Devnet (91337)** and **Qubitor
Testnet (91338)** only. There is no Mainnet chain config. Choose:

- **Path A — Testnet beta** (recommended now): TestFlight + Play internal
  testing + unlisted Chrome extension, clearly labelled "Testnet". Achievable
  with the items below.
- **Path B — Public mainnet wallet**: additionally requires a Qubitor Mainnet
  chain config, an external security audit, and recovery hardening beyond the
  encrypted Recovery Kit. Out of scope until those land.

## Build profiles

`apps/mobile/eas.json` defines three profiles:

| Profile | Use | Debug cycle | Biometric | Chain |
|---|---|---|---|---|
| `development` | local dev client | on | off | env |
| `testnet-beta` | TestFlight / Play internal | off | required | Testnet 91338 |
| `production` | store release (Path B only) | off | required | env / mainnet |

Build: `eas build --profile testnet-beta --platform all`
Submit: `eas submit --profile production --platform ios|android`

## Blockers before ANY store submission

- [ ] **Run on real iOS + Android hardware.** Everything so far is verified via
      `pnpm typecheck` + web export only. Exercise on-device: biometric unlock
      (`expo-secure-store` `requireAuthentication`), SecureStore persistence,
      deep links (`quanta://`), system share sheet (Recovery Kit export),
      QR rendering, keyboard handling on Send.
- [ ] **EAS project + credentials.** `eas init`; let EAS manage iOS
      distribution certs / provisioning and the Android keystore. (Cannot be
      done from this repo — needs the Apple Developer + Google Play accounts.)
- [ ] **Bundle identifiers are final.** `com.quanta.wallet` (iOS + Android),
      scheme `quanta://`, extension rdns `org.quanta.wallet`. Changing these
      post-publish is painful — confirm now.
- [ ] **App icons / splash verified on device** at all densities (assets are
      in `apps/mobile/assets/`; Expo resizes at build).
- [ ] **Privacy disclosures** completed — see `docs/PRIVACY.md`. Apple Privacy
      Nutrition Label + Google Play Data Safety form. A PQ wallet will get
      scrutiny; answer truthfully (local-only key storage, no analytics).
- [ ] **Store listings**: name "Quanta Wallet", description, screenshots
      (capture from on-device runs, not the SWallet source), category Finance,
      age rating, support URL, marketing URL.
- [ ] **"Testnet" labelling** in the listing + first-run notice for Path A so
      reviewers and users know funds are not mainnet value.

## Blockers before a PUBLIC MAINNET release (Path B)

- [ ] Qubitor Mainnet chain config in `@qubitor/evm` + a real go/no-go.
- [ ] External security review of: the ML-DSA PQ tx path
      (`signQubitorPQTxV1`/`sendRawQubitorPQTxV1`), the precompile interaction
      (`QUBITOR_MLDSA65_PRECOMPILE`), on-device key storage
      (`lib/pqDevWallet.ts`), and the extension EIP-1193/6963 surface.
- [ ] Recovery hardening beyond the encrypted Recovery Kit: guardian /
      multi-device recovery (currently honest "coming soon" — no on-chain
      module yet). Single-device key loss = fund loss until this exists.
- [ ] Incident / key-compromise response plan and a support channel.

## Desktop (macOS / Windows / Ubuntu)

`apps/desktop` is a **Tauri v2** shell wrapping the shared Expo
`react-native-web` static export. The wallet logic, Qubitor RPC client and
ML-DSA-65 signing are identical to mobile; only key-at-rest differs.

| OS | Bundles | Key storage |
|---|---|---|
| macOS | `.dmg`, `.app` | Keychain |
| Windows | `.msi`, NSIS `.exe` | Credential Manager |
| Ubuntu | `.AppImage`, `.deb` | Secret Service (libsecret) |
| Ubuntu Store | `.snap` | Snap private user data, passcode-encrypted |

- [ ] **Standalone keystore security review (mainnet blocker).** Desktop owns
      its own ML-DSA key. The blob is passcode-encrypted by `@qubitor/pq-crypto`
      (same algorithm as mobile) before it reaches the OS keychain via the Rust
      `vault_*` commands (`apps/desktop/src-tauri/src/lib.rs`). A desktop
      process is more exposed than a phone secure enclave — a desktop-specific
      review of this path is required before any mainnet use.
- [ ] **Ubuntu support matrix.** Tauri v2 needs `webkit2gtk-4.1` → clean on
      **Ubuntu 22.04 / 24.04**. 20.04 is unsupported (EOL, old webkitgtk).
      `.AppImage` gives the widest forward compatibility; `.deb` targets 22.04+.
- [ ] **Snap Store / Ubuntu Store.** Root `snapcraft.yaml` builds the strict
      `quanta-wallet` snap from the Tauri `.deb` bundle. Snap strict
      confinement does not rely on Secret Service; the already passcode-
      encrypted profile record is stored under `$SNAP_USER_DATA`, so extension-
      style wallet persistence survives app restarts and snap updates without a
      privileged `password-manager-service` connection. Before publishing:
      `snapcraft login`, `snapcraft register quanta-wallet`, then add
      `SNAPCRAFT_STORE_CREDENTIALS` to GitHub secrets from
      `snapcraft export-login --snaps quanta-wallet --channels edge,beta,candidate,stable -`.
      Build locally with `snapcraft`; test with
      `sudo snap install ./quanta-wallet_0.0.24_amd64.snap --dangerous`.
- [ ] **Unsigned by default.** macOS `.app`/`.dmg` is unsigned → Gatekeeper
      "unidentified developer"; Windows `.exe`/`.msi` → SmartScreen. Real fix
      = Apple Developer ID cert + Windows Authenticode cert wired into
      `tauri-action` as CI secrets. Until then releases are labelled "unsigned".
- [ ] No auto-update feed (Tauri updater not enabled — needs a signed release
      host).

Local build: `pnpm --filter @qubitor/desktop build` (see
`apps/desktop/README.md`).

### Microsoft Store / Windows Store

Use the Microsoft Store **MSI/EXE unpackaged Win32 app** path first. Quanta
Wallet is a Tauri desktop app, so Partner Center can test a normal offline
Windows installer URL without us converting the app to MSIX.

Repo support:

- `pnpm --filter @qubitor/desktop build:windows-store` builds only the Windows
  `.msi` and NSIS `.exe` bundles.
- `.github/workflows/windows-store.yml` runs on `windows-latest`, stages stable
  Partner Center asset names, uploads a workflow artifact, and can attach the
  assets to a GitHub Release:
  - `quanta-wallet-windows-store-x64.msi`
  - `quanta-wallet-windows-store-x64-setup.exe`
  - `SHA256SUMS-WINDOWS.txt`

Run the workflow manually:

1. Open **Actions → Windows Store → Run workflow**.
2. Set `release_tag` to the immutable release tag, for example `v0.0.24`.
3. Leave `upload_to_release=true`.
4. Use the GitHub Release asset URL in Partner Center:
   `https://github.com/QubitorNetwork/Qubitor-wallet/releases/download/v0.0.24/quanta-wallet-windows-store-x64.msi`

Microsoft expects the installer behind a submitted URL to remain unchanged.
After you submit a URL to Partner Center, do not rerun the workflow with the
same tag and `--clobber` that asset. For app updates, cut a new release tag and
submit the new URL.

Optional Authenticode signing:

- Add `WINDOWS_CERTIFICATE_PFX_BASE64` and `WINDOWS_CERTIFICATE_PASSWORD` as
  GitHub repository secrets.
- The workflow will sign `.msi` and `.exe` installers before staging them.
- Without these secrets the installers are still built, but are unsigned and
  may receive SmartScreen warnings outside the Store.

## CI / Release (GitHub Actions)

- `.github/workflows/ci.yml` — on push to `main` + every PR: `pnpm install
  --frozen-lockfile`, `turbo typecheck`, `turbo lint`, extension build, Foundry
  `forge test`. Pinned: pnpm 10.18.2, Node 20, Ubuntu 22.04.
- `.github/workflows/release.yml` — on a `v*` tag, three jobs feed one
  public GitHub Release with downloadable assets:
  - **desktop** matrix (`macos-14`, `windows-latest`, `ubuntu-22.04`) via
    `tauri-action` → installers above.
  - **extension** → `quanta-extension-chrome-mv3.zip`.
  - **android** → self-signed `quanta-wallet.apk` when the best-effort Android
    build succeeds (sideload testing only; Play upload still needs the EAS
    `production` path + a real upload key).
  - Final job waits for Android too, downloads every produced artifact,
    attaches all apps plus `SHA256SUMS`, and publishes/updates the release.
    **No iOS** (no Apple account).
- `.github/workflows/snapcraft.yml` — on a `v*` tag, builds the Snapcraft
  package as a workflow artifact. Manual dispatch can also publish to the Snap
  Store channel selected in the workflow inputs when `publish=true` and the
  `SNAPCRAFT_STORE_CREDENTIALS` secret is configured.

Tag a release: `git tag v0.0.1 && git push origin v0.0.1`. Verify downloads
with `sha256sum -c SHA256SUMS` after download.

## Chrome extension

- [ ] `pnpm --filter @qubitor/extension build` → load
      `apps/extension/build/chrome-mv3-prod` unpacked for final QA.
- [ ] `pnpm --filter @qubitor/extension package` → zip for the Chrome Web
      Store. Start **unlisted** for the beta.
- [ ] Web Store listing + privacy practices form (same disclosures as mobile).

## Known "coming soon" surfaces (disclose in listing, don't hide)

Bridge, Swap, NFTs, token balances beyond native QBT, ERC-20 approvals,
guardian/multi-device recovery, multi-account. These render honest
"coming soon / unavailable" states — no mock data. List them as roadmap, not
shipped features.

## Pre-submit verification (every build)

```sh
pnpm turbo typecheck                 # 8/8
forge test --root packages/contracts # 9/9
pnpm --filter @qubitor/extension build
```
CI (`ci.yml`) runs this same guard on every PR.
Then a manual on-device smoke of: create account → backup Recovery Kit →
faucet → deploy → send (real simulation) → activity → rotate key → reset.
