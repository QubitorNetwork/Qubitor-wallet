# MVP Flow Specification

## Flow Standard

Each flow must define:

- Entry point
- User intent
- Preconditions
- Steps
- Required copy
- Data required
- Warnings
- Exit states
- Activity events

## New Qubitor Account Onboarding

Entry point: Welcome screen.

User intent: create a new account that uses a normal EVM-compatible 0x address but has smarter Qubitor account security.

Preconditions:

- User has no active Qubitor Account in this wallet.
- Supported network configuration is available.

Steps:

1. Show Welcome.
2. User selects Create Qubitor Account.
3. Explain that Qubitor creates a normal EVM-compatible `0x` smart account address.
4. Explain that quantum readiness comes from validation logic, not the address.
5. Generate or initialize the account.
6. Derive the deterministic account address.
7. Show Your `0x` Address.
8. Prompt Security Setup.
9. Prompt Recovery Setup.
10. Show Setup Summary.
11. Land on Home.

Required copy:

> Your Qubitor Account is a normal 0x address with smarter security underneath.

Data required:

- Account address
- Chain ID
- Account deployment status
- Initial validation mode
- Recovery status
- Security mode

Warnings:

- If account is counterfactual, explain it will deploy on first supported action.
- If recovery is skipped, warn before large deposits.

Exit states:

- Account created with recovery configured.
- Account created with recovery skipped and warning active.
- Account creation failed.

Activity events:

- Account created
- Security module configured
- Recovery configured or skipped

## Existing Wallet Connection

Entry point: Welcome or Settings.

User intent: use an existing wallet to initialize or control a Qubitor Account.

Preconditions:

- Existing wallet provider is available.

Steps:

1. User selects Connect Existing Wallet.
2. Wallet explains the existing wallet is used to create or control a Qubitor smart account.
3. User connects provider.
4. Qubitor derives or creates smart account destination.
5. Show Qubitor `0x` smart account address.
6. Offer optional migration scan.
7. Continue to Security Setup and Recovery Setup.

Required copy:

> Use your existing wallet to create and control a smarter Qubitor Account.

Warnings:

- Do not say the old wallet will be broken by quantum computers.
- Warn if legacy wallet still controls the smart account.

Exit states:

- Existing wallet linked.
- User rejects connection.
- Provider unsupported.

Activity events:

- Existing wallet connected
- Qubitor Account created

## Hybrid Protection Setup

Entry point: Onboarding, Security Center, Readiness Report.

User intent: improve account security without losing compatibility.

Preconditions:

- Qubitor Account exists.
- Initial control method exists.

Steps:

1. Show current mode: Smart Account Ready.
2. Explain hybrid protection.
3. Register future-ready security layer.
4. Confirm with current authorization policy.
5. Enable hybrid module.
6. Show new mode: Hybrid Protected.
7. Show compatibility boundary.

Required copy:

> Hybrid protection combines current EVM-compatible security with a future-ready authorization layer.

Warnings:

- If some chains or apps remain legacy, show compatibility boundary.
- Do not claim universal PQ protection.

Exit states:

- Hybrid protection enabled.
- Setup pending.
- Setup failed.

Activity events:

- Validation module changed
- Security mode changed

## Recovery Setup

Entry point: Onboarding, Security Center, warning banner.

User intent: protect access without changing public account identity.

Preconditions:

- Qubitor Account exists.

Steps:

1. Explain recovery.
2. Show recovery options.
3. User selects method.
4. Show strength and tradeoffs.
5. Configure guardians, devices, passkey, hardware, team, or advanced policy.
6. Confirm setup.
7. Offer test recovery mode.
8. Show Recovery Center.

Required copy:

> Recovery helps you regain access if a device is lost, a key is replaced, or your account needs to rotate to a safer authorization method.

Warnings:

- Recovery not configured.
- Recovery threshold too low.
- Recovery delay disabled.
- Removing all recovery methods.

Exit states:

- Recovery active.
- Recovery skipped.
- Recovery incomplete.

Activity events:

- Recovery configured
- Recovery tested
- Recovery policy changed

## Send Transaction

Entry point: Home quick action, asset detail, dapp request.

User intent: send an asset safely.

Preconditions:

- Account exists.
- Asset balance exists.
- Network is available.

Steps:

1. Select Send.
2. Select asset.
3. Enter recipient.
4. Enter amount.
5. Select network if needed.
6. Run recipient checks.
7. Simulate transaction.
8. Show Transaction Review.
9. User confirms or rejects.
10. Show pending state.
11. Show completion or failure.

Required copy:

> Send from your Qubitor 0x smart account.

Warnings:

- New address.
- Address looks similar to recent address.
- Recipient is a contract.
- Simulation failed.
- Compatibility mode.
- Legacy signing.

Exit states:

- Transaction confirmed.
- Transaction pending.
- Transaction rejected.
- Transaction failed.
- Blocked by policy.

Activity events:

- Transaction sent
- Transaction failed
- Security warning

## Transaction Review

Entry point: Send, dapp contract interaction, bridge, approval flow.

User intent: understand exactly what will happen before approval.

Preconditions:

- Transaction draft exists.

Steps:

1. Show action summary.
2. Show From: Qubitor `0x` smart account.
3. Show To address or contract.
4. Show asset movement preview.
5. Show fee and gas payment mode.
6. Show simulation result.
7. Show security mode.
8. Show validation method.
9. Show warnings.
10. Allow advanced details expansion.
11. User confirms or rejects.

Required copy:

> This transaction uses your Qubitor smart account validation.

Warnings:

- Unexpected asset movement.
- Unlimited approval.
- Contract revert.
- Paymaster risk.
- Legacy or compatibility mode.

Exit states:

- Confirmed.
- Rejected.
- Edited.
- Blocked by policy.

Activity events:

- Transaction reviewed
- Transaction confirmed
- Transaction rejected

## Message Signing

Entry point: Dapp request.

User intent: decide whether to sign a message.

Preconditions:

- Dapp connection request or active session exists.

Steps:

1. Classify request.
2. Show requesting app and domain.
3. Show message type.
4. Show human-readable summary.
5. Show risk level.
6. Show security mode.
7. Show raw payload expandable.
8. User signs or rejects.

Required copy:

> This signature may authorize actions outside this screen. Only continue if you trust this app and understand the request.

Warnings:

- Raw hex.
- Unknown typed data.
- Permit can move funds.
- Domain mismatch.
- High-risk signature.

Exit states:

- Signed.
- Rejected.
- Blocked by policy.

Activity events:

- Message signed
- Signature rejected
- Security warning

## Dapp Connection

Entry point: Dapp provider request.

User intent: connect safely with understandable permissions.

Preconditions:

- Dapp origin is known.

Steps:

1. Show dapp name and domain.
2. Show verified status.
3. Show requested account.
4. Show requested chain.
5. Show permissions.
6. Show compatibility mode status.
7. User connects, connects with limited session, opens advanced permissions, or rejects.

Required copy:

> This app wants to connect to your Qubitor Account.

Warnings:

- Unverified app.
- Domain mismatch.
- Broad permissions.
- Compatibility mode.

Exit states:

- Connected.
- Connected with limited session.
- Rejected.
- Blocked.

Activity events:

- Dapp connected
- Session key created
- Dapp rejected

## Key Rotation

Entry point: Security Center, notification, emergency flow.

User intent: update authorization keys while preserving account identity.

Preconditions:

- Account exists.
- Current policy can authorize key rotation.

Steps:

1. Explain what changes.
2. Show current key/module.
3. Generate or register replacement.
4. Simulate account update.
5. Show before-and-after summary.
6. Confirm stable address.
7. User confirms.
8. Submit update.
9. Confirm new key active.
10. Disable or downgrade old key.

Required copy:

> Your Qubitor address stays the same. Only the security keys behind it are being updated.

Warnings:

- Rotation may affect some apps.
- Compatibility mode may be required on unsupported chains.
- Emergency rotation freezes sessions where supported.

Exit states:

- Rotation complete.
- Rotation pending.
- Rotation failed.
- User cancelled.

Activity events:

- Key rotated
- Account module changed
- Sessions frozen if emergency

## Bridge

Entry point: Home quick action, asset detail.

User intent: move assets between chains.

Preconditions:

- Supported route exists.

Steps:

1. Select source chain.
2. Select destination chain.
3. Select asset.
4. Enter amount.
5. Show source and destination account.
6. Show route and route security label.
7. Show fees and estimated time.
8. Show route warnings.
9. User confirms.
10. Track bridge progress.
11. Show completion or failure recovery.

Required copy:

> The bridge uses your Qubitor 0x smart account as your bridge identity where supported.

Warnings:

- Legacy bridge route.
- Unsupported asset.
- Route unavailable.
- Destination finalization delayed.
- Insufficient gas.

Exit states:

- Bridge complete.
- Bridge pending.
- Claim required.
- Failed.
- Blocked by policy.

Activity events:

- Bridge started
- Bridge completed
- Bridge delayed
- Bridge failed

## Developer Debug

Entry point: Developer Mode.

User intent: inspect raw account and transaction mechanics.

Preconditions:

- Developer Mode enabled.

Steps:

1. Open account or activity detail.
2. Show account contract.
3. Show implementation and modules.
4. Show UserOperation if applicable.
5. Show bundler and paymaster data.
6. Show raw calldata and signature payload.
7. Show simulation trace.
8. Allow export.

Required copy:

> Developer Mode shows raw account and transaction details. Normal users do not need these fields to use Qubitor safely.

Warnings:

- Advanced details only.
- Raw payload may be difficult to interpret.

Exit states:

- Export created.
- Developer Mode disabled.

Activity events:

- None required unless export is stored.
