# Privacy & Data Handling — Quanta Wallet

Source of truth for the App Store Privacy Nutrition Label, Google Play Data
Safety form, and Chrome Web Store privacy practices. Written to be answered
truthfully — every claim below is verifiable in the codebase.

## Summary

Quanta Wallet is local-first. It does not run analytics, does not have a
backend server, and does not transmit personal data to the publisher. The only
network calls are to the user-configured Qubitor RPC / faucet / PQ relayer
endpoints, which are required for wallet function.

## What is stored, where, and why

| Data | Where | Why | Leaves device? |
|---|---|---|---|
| ML-DSA private key (Control Key) | `expo-secure-store` (Keychain / Keystore), `keychainService: quanta.wallet.mldsa65.profile`, device-only, optional biometric gate | Sign PQ transactions | **No.** Only via a user-initiated encrypted Recovery Kit export to the system share sheet. |
| Account deployment metadata | SecureStore profile | Track counterfactual→deployed | No |
| Wallet activity log | `AsyncStorage` (`quanta.wallet.activity.*`) | Show Activity / Notifications | No |
| Address book contacts | `AsyncStorage` (`quanta.wallet.addressbook.v1`) | Send convenience + poisoning checks | No |
| Selected network | `AsyncStorage` (`quanta.wallet.network.v1`) | Persist chain choice | No |
| Recovery Kit backup status (timestamp only) | `AsyncStorage` (`quanta.wallet.backup.v1.*`) | "Backed up?" gate | No |

No names, emails, contacts-import, location, advertising IDs, or device
fingerprints are collected.

## Network requests

- **Qubitor RPC** (`EXPO_PUBLIC_QUBITOR_RPC_URL`): balance, deployment,
  readiness, latest block, `eth_call`/`eth_estimateGas`/`eth_gasPrice`
  simulation, raw PQ tx submission. Sends: the account address and signed
  transactions. Standard blockchain RPC; the node operator sees on-chain
  activity as with any wallet.
- **Faucet** (`EXPO_PUBLIC_QUBITOR_FAUCET_URL`): testnet/devnet token requests.
- **PQ relayer** (`EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL`): PQ account
  deploy/transfer relay.
- **Google Fonts** (Space Grotesk / Inter / JetBrains Mono): fetched at first
  paint via `@expo-google-fonts` (mobile) and a CSS `@import` (extension).
  Consider self-hosting fonts before public release to remove this third-party
  request.

No third-party analytics, crash, or telemetry SDKs are integrated.

## Browser extension

- Injects an EIP-6963 provider (`org.quanta.wallet`). Connection state is
  stored in `chrome.storage` (local). `host_permissions` are broad
  (`https://*/*`,`http://*/*`) to expose the provider to dapps — disclose this
  in the Web Store listing.
- No browsing history is read or transmitted; only the active tab's origin is
  used to match an existing connection in the popup.

## Disclosure form answers (draft)

- Data collected: **None** transmitted to the publisher.
- Data shared with third parties: **None.**
- Data stored on device: keys + wallet state (see table). Encrypted at rest by
  OS Keychain/Keystore for key material.
- Account deletion: **Settings → Reset wallet** wipes the SecureStore key and
  all `quanta.wallet.*` AsyncStorage in-app, on device. No server-side data
  exists to delete.
- Security: ML-DSA-65 (post-quantum) signatures; key never leaves device
  except via user-initiated passcode-encrypted backup.

## Open items before public release

- [ ] Decide on self-hosting fonts (removes the Google Fonts request).
- [ ] Legal review of this document and the store-facing privacy policy URL.
- [ ] Confirm the broad extension `host_permissions` is justified in the Web
      Store review notes (required for the injected provider).
