# Quanta Wallet Privacy Policy

Last updated: June 12, 2026

Quanta Wallet is a local-first wallet for Qubitor Network. This policy explains
what data Quanta Wallet handles, why it is needed, where it is stored, and when
it may leave your device.

This policy applies to the Quanta Wallet browser extension and the Quanta
Wallet mobile/desktop apps.

## Summary

Quanta Wallet does not sell user data, does not use user data for advertising,
and does not include analytics, tracking, or telemetry SDKs.

Quanta Wallet handles wallet-related data only to provide its wallet features:
creating a Quanta Account, showing QBT balances, connecting to dapps, approving
transactions, storing local wallet state, and submitting user-approved Qubitor
Network transactions.

Private key material and wallet passcodes are not sent to the publisher. Private
key material is stored locally in encrypted form.

## Data Quanta Wallet Handles

Quanta Wallet may handle the following wallet-related data:

- Public Qubitor account address
- Public key or public account preview data
- Native QBT balance
- Transaction requests, transaction hashes, and local transaction history
- Connected dapp origin and permission status
- Pending approval request state
- Encrypted wallet vault data
- Local wallet settings, such as selected network and backup status

The Chrome Web Store data categories that best describe this are:

- Financial and payment information: public wallet addresses, balances,
  transaction requests, and transaction hashes.
- Authentication information: encrypted local wallet vault data and local
  passcode-based unlock data.

## Data Quanta Wallet Does Not Collect

Quanta Wallet does not collect or transmit the following to the publisher:

- Names, email addresses, phone numbers, or government IDs
- Health information
- Personal communications
- Location
- Web browsing history
- Advertising IDs
- Device fingerprints
- Page content for analytics, advertising, profiling, or resale

The browser extension uses host access only to inject the Quanta Wallet provider
into pages so dapps can request wallet access. It does not read or transmit your
browsing history.

## Local Storage

Quanta Wallet stores wallet state locally so the wallet can work across browser
restarts and app restarts.

In the browser extension, data is stored with `chrome.storage.local`. This may
include:

- The encrypted wallet profile
- A plaintext public preview containing the chain ID, account address, public
  key information, and key version
- Connected site permissions
- Pending approval requests and recent provider responses
- Local transaction/activity history

In the mobile and desktop apps, wallet state is stored using the platform
storage available to the app, including secure key storage where supported.

Private key material is stored inside an encrypted payload. Quanta Wallet does
not intentionally store private keys or passcodes as plaintext.

## Network Requests

Quanta Wallet makes network requests that are required for normal wallet
operation.

These may include requests to:

- Qubitor RPC endpoints, such as `https://testrpc.qubitor.org/rpc`, to read
  balances, blocks, account state, gas estimates, and transaction receipts.
- Qubitor faucet or PQ submitter endpoints, when you request testnet QBT or
  submit a PQ-native transaction.
- Qubitor explorer pages, when you open an explorer link.
- Dapps you choose to connect to, when you approve account access or transaction
  requests.

Blockchain RPC nodes, faucet services, relayers, explorers, and connected dapps
may receive public wallet data needed to perform the requested action, such as
your public account address, transaction hash, signed transaction payload, or
the origin of a dapp connection. Public blockchain transactions are visible on
the relevant network and explorer.

Quanta Wallet does not send wallet data to a publisher analytics server.

## Dapp Connections

When a website or dapp asks to connect to Quanta Wallet, Quanta Wallet shows an
approval flow or uses an existing user-approved connection. Approved dapps may
receive your public Quanta Account address.

Transaction signing and transaction submission require user approval. Quanta
Wallet does not give dapps access to private keys.

You can remove connected-site approvals from the wallet UI where supported, or
wipe wallet data to remove the encrypted wallet profile and local connection
state.

## Permissions Used By The Browser Extension

Quanta Wallet requests the following Chrome extension permissions:

- `storage`: stores the encrypted wallet profile, connected-site permissions,
  local wallet state, and pending approval request state.
- `tabs`: identifies the tab and origin making a wallet request and returns the
  approval result to the correct page.
- Host permissions for `http://*/*` and `https://*/*`: allow Quanta Wallet to
  inject its wallet provider on dapp pages so those pages can detect the wallet
  and request account access or transaction approval.

These permissions are used only to provide Quanta Wallet's wallet and dapp
connection features.

## Data Sharing

Quanta Wallet does not sell user data.

Quanta Wallet does not transfer user data for advertising, creditworthiness, or
unrelated purposes.

Data may be transmitted only when necessary to provide wallet functionality,
such as:

- Sending a user-approved request to a Qubitor RPC, faucet, submitter, relayer,
  explorer, or connected dapp.
- Publishing a user-approved transaction to a blockchain network.
- Complying with applicable law or responding to security abuse where legally
  required.

## Security

Quanta Wallet is designed so sensitive wallet key material remains local to the
user's device.

Private key material is stored in encrypted form. Passcodes are used locally to
unlock encrypted wallet data. Quanta Wallet does not display private keys
casually and does not provide private keys to connected websites.

No software wallet can remove all risk. Users are responsible for protecting
their device, browser profile, passcode, backups, and recovery materials.

## User Controls

Users can:

- Disconnect approved dapps where the wallet UI supports it.
- Wipe wallet data from the wallet UI.
- Remove the extension from Chrome.
- Clear extension data through the browser profile.

Wiping wallet data removes local wallet profile data, local activity history,
connected-site approvals, pending provider requests, and stored provider
responses from the local browser extension storage.

Because Quanta Wallet does not operate a user-account backend, there is no
server-side wallet account to delete.

## Children

Quanta Wallet is not directed to children and does not knowingly collect data
from children.

## Changes To This Policy

This policy may be updated as Quanta Wallet changes. Material changes will be
reflected in this document.

## Contact

For privacy or security questions, open an issue in the Quanta Wallet repository:

https://github.com/QubitorNetwork/Qubitor-wallet
