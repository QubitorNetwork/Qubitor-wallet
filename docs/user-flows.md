# User Flows

## New User Onboarding

Goal: create a Qubitor smart account with a standard `0x` address and explain the security model without confusion.

Steps:

1. Show welcome screen: "Create your Quanta Account."
2. Explain that the account will use a normal EVM-compatible `0x` address.
3. Generate or initialize the Qubitor smart account.
4. Derive or deploy the account address using deterministic smart account deployment.
5. Display the user's Qubitor `0x` address.
6. Set initial validation mode.
7. Set up the post-quantum-ready security layer where supported.
8. Ask user to configure recovery before using the account heavily.
9. Show the Home dashboard with address, balance, security mode, and readiness status.

Required screens:

- Welcome
- Create Quanta Account
- Generating Account
- Your `0x` Address
- Security Setup
- Recovery Setup
- Home Dashboard

## Smart Account Creation

Steps:

1. Explain smart account in one paragraph.
2. Generate or connect the initial authorization method.
3. Derive the counterfactual smart account address.
4. Show the address before deployment when possible.
5. Deploy account or mark deployment as pending until first transaction.
6. Configure initial validation mode.
7. Log account creation in Activity.

Required copy:

> A smart account is a wallet with programmable security. It can rotate keys, add recovery, limit app permissions, and support future-ready signing methods without changing your public account address.

## Hybrid Protection Setup

Steps:

1. Show current state: Smart Account Ready.
2. Explain hybrid protection.
3. Generate or register future-ready security key.
4. Ask for confirmation with current wallet, device, or account policy.
5. Enable hybrid validation module.
6. Show new state: Hybrid Protected.
7. Log module change in Activity.

Required copy:

> Hybrid protection combines current EVM-compatible security with a future-ready authorization layer. It helps your account prepare for post-quantum account control while staying usable with supported apps.

## Recovery Setup

Steps:

1. Explain why recovery matters before large deposits.
2. Let user choose guardian, multi-device, hardware-assisted, passkey-assisted, team, or advanced recovery.
3. Show strength of selected method.
4. Confirm setup.
5. Show recovery status.
6. Offer test recovery mode.
7. Log recovery setup in Activity.

Required copy:

> Recovery helps you regain access if a device is lost, a key is replaced, or your account needs to rotate to a safer authorization method.

## Send Transaction

Steps:

1. User selects Send.
2. Select asset.
3. Enter recipient.
4. Enter amount.
5. Choose network, if needed.
6. Run recipient checks.
7. Simulate transaction.
8. Review transaction.
9. Confirm signing or validation.
10. Show pending state.
11. Show completion.
12. Log transaction in Activity.

Recipient checks:

- Address format
- Name-service resolution, if supported later
- Chain compatibility
- Known contract address
- New address warning
- Address poisoning similarity
- Saved contact match

## Receive Funds

Steps:

1. User selects Receive.
2. Show Quanta Account label.
3. Show `0x` smart account address.
4. Show QR code.
5. Show network selector when chain-specific deposits matter.
6. Explain that this is a Qubitor smart account address using a normal 0x format.
7. Warn when selected network has weak or unsupported Qubitor security features.

Required copy:

> This is your Quanta Wallet address. It uses a normal EVM-compatible 0x format, but it is secured by smart-account validation.

## Dapp Connection

Steps:

1. Dapp requests connection.
2. Wallet shows app name, domain, verification status, chain, and requested account.
3. Wallet shows permissions requested.
4. Wallet identifies compatibility mode if needed.
5. User chooses full connection, limited session, advanced permissions, or reject.
6. Wallet logs connection in Activity.

Compatibility copy:

> This app may require compatibility mode. Some actions may use legacy signing and may not receive full Qubitor protection.

## Message Signing

Steps:

1. Dapp requests signature.
2. Wallet classifies request: login, permit, order, governance vote, transaction authorization, unknown typed data, raw message, or high-risk message.
3. Wallet shows readable summary.
4. Wallet shows risk level and security mode.
5. User confirms or rejects.
6. Wallet logs signature event in Activity.

High-risk copy:

> This signature may authorize actions outside this screen. Only continue if you trust this app and understand the request.

## Session Key Creation

Steps:

1. User or dapp requests a session key.
2. Wallet shows app/domain and chain.
3. User sets duration, max total spend, max per transaction, allowed contracts, allowed methods, and allowed tokens.
4. Wallet warns for broad scopes, high spend, no expiration, or unknown app.
5. User confirms.
6. Wallet logs session key creation in Activity.

## Key Rotation

Steps:

1. User starts key rotation.
2. Wallet explains what will change.
3. Generate or register new key.
4. Authenticate with current policy.
5. Simulate account update.
6. Show before-and-after summary.
7. User confirms.
8. Submit account update.
9. Confirm new key active.
10. Disable or downgrade old key.
11. Log rotation in Activity.

Required copy:

> Your Qubitor address stays the same. Only the security keys behind it are being updated.

## Emergency Rotation

Steps:

1. User selects emergency mode.
2. Wallet freezes sessions where supported.
3. Wallet prompts review or revocation of dapp permissions.
4. User rotates key.
5. Wallet increases confirmation requirements if policy supports it.
6. Wallet notifies guardians where configured.
7. Wallet shows recent activity review.

## Bridge Flow

Steps:

1. Select source chain.
2. Select destination chain.
3. Select asset.
4. Enter amount.
5. Show source or destination Qubitor `0x` smart account.
6. Show route.
7. Show bridge security status.
8. Show fees and estimated time.
9. Confirm source transaction.
10. Track bridge progress.
11. Confirm destination receipt.

Bridge progress stages:

- Preparing transaction
- Source transaction submitted
- Source finalized
- Bridge message detected
- Destination pending
- Destination finalized
- Complete

## Developer Transaction Debug

Steps:

1. User enables Developer Mode.
2. User opens a transaction review or historical activity item.
3. Wallet shows decoded calldata and raw calldata.
4. Wallet shows UserOperation data when applicable.
5. Wallet shows EntryPoint, bundler, paymaster, validation gas, call gas, pre-verification gas, signature bytes, and module used.
6. User can export debug JSON.
