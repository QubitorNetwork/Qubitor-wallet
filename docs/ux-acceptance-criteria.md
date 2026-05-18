# UX Acceptance Criteria

## Definition of UX Done

The UX for a screen or flow is done when it defines:

- Purpose
- Primary user goal
- Entry points
- Exit states
- Required content
- Required copy
- Data required
- Empty states
- Loading states
- Error states
- Warning states
- User actions
- Edge cases
- Activity events
- Security mode disclosure
- Stable `0x` address implications, where relevant

## Global Acceptance Criteria

### Address Model

- Every account surface labels the primary identity as a Qubitor Account.
- Every receive/address surface shows a standard `0x` address.
- The UX never introduces a non-`0x` user address format.
- The UX never implies the address itself provides quantum resistance.
- Key rotation and recovery flows explicitly state that the public address remains the same.

### Quantum-Readiness Honesty

- Security states are labels, not marketing claims.
- Every transaction review shows the security mode used.
- Every message signing review shows the security mode used.
- Every bridge route shows the route security status.
- Compatibility mode is visible when required.
- External dependencies are named in readiness reporting.
- The product avoids language like "fully quantum-proof" or "100% quantum safe."

### Normal User Comprehension

- Smart account explanation fits in one short paragraph.
- Algorithm or module names are hidden by default.
- Recovery is prompted before significant fund movement.
- Warnings are calm, specific, and actionable.
- No screen requires the user to approve raw hex without a decoded summary.

### Power User Transparency

- Advanced details are available from sensitive reviews.
- Developer Mode exposes account contract, factory, validation modules, UserOperation, bundler, paymaster, calldata, signature payload, and simulation traces.
- Activity history stores security events, not only value transfers.

## Screen Acceptance Criteria

### Welcome

- Explains Qubitor as a smart wallet for Qubitor Network's post-quantum account model.
- Offers Create Qubitor Account, Connect Existing Wallet, Recover Account, and Learn More.
- Does not mention algorithm names.
- Does not overstate quantum resistance.

### Create Qubitor Account

- Explains that the account receives a normal EVM-compatible `0x` address.
- Explains the account is a smart account, not a traditional private-key-only wallet.
- Shows progress while deriving or deploying account.
- Offers advanced details without requiring them.

### Your 0x Address

- Shows Qubitor Account label.
- Shows full or copyable `0x` address.
- Provides copy and QR actions.
- States that the address works with supported EVM apps.
- States that smart-account validation provides the stronger control model.
- Explains counterfactual deployment if relevant.

### Home

- Shows address, balance, security badge, readiness status, quick actions, recent activity, and alerts.
- Makes Recovery and Security visible without burying them in settings.
- Shows compatibility or recovery warnings when active.
- Provides quick path to Send, Receive, Bridge, Apps, and Security.

### Security Center

- Shows account type and validation mode.
- Shows Post-Quantum Layer status.
- Shows Recovery status.
- Shows Key Rotation status.
- Shows Connected Apps and Approval Risk.
- Provides a Quantum Readiness Report entry point.
- Does not imply external chains or dapps are automatically PQ-ready.

### Recovery Setup

- Explains why recovery matters.
- Shows available recovery methods.
- Shows strength and tradeoffs of the selected method.
- Offers test recovery.
- Warns before weak thresholds, disabled delays, or removing all recovery.
- Logs setup and changes in Activity.

### Key Rotation

- Shows before-and-after summary.
- Explains the Qubitor `0x` address stays the same.
- Shows compatibility impact.
- Shows rollback or recovery path where applicable.
- Logs rotation in Activity.

### Send

- Requires asset, recipient, amount, and network.
- Checks recipient format, chain compatibility, known contracts, new addresses, and address poisoning similarity.
- Runs simulation before review when possible.
- Does not go directly from entry to signing.

### Transaction Review

- Shows From: Qubitor `0x` smart account.
- Shows To address or contract.
- Shows human-readable action summary.
- Shows asset movement preview.
- Shows fee and gas payment mode.
- Shows simulation result.
- Shows security mode and validation method.
- Shows warnings before confirm.
- Provides advanced details.

### Message Signing Review

- Classifies request type.
- Shows app, domain, account, chain, message type, summary, risk level, and security mode.
- Strongly warns for raw hex, unknown typed data, permits, domain mismatch, and high-risk signatures.
- Stores signature history in Activity.

### Dapp Connection

- Shows dapp name, domain, verification status, chain, account, permissions, session duration, and compatibility mode.
- Offers Connect, Connect with Limited Session, Reject, and Advanced Permissions.
- Allows later revocation from Apps.

### Apps

- Lists connected apps with domain, account, chain, permissions, session limits, spending limits, last used, risk level, and security mode.
- Shows compatibility mode where relevant.
- Provides revoke and edit permission actions.

### Bridge

- Shows source chain, destination chain, asset, amount, route, fees, estimated time, account addresses, and route security status.
- Shows finality/progress timeline.
- Explains failures with user actions.
- Does not require a bridge-only address format.

### Activity

- Includes transactions, signatures, dapp connections, approvals, sessions, key rotations, recovery changes, bridge events, warnings, and module changes.
- Every detail includes security mode and raw details expansion.

### Developer Mode

- Hidden from normal users by default.
- Shows account abstraction details when enabled.
- Allows export of transaction debug JSON, account config JSON, readiness report, connected app list, and recovery policy summary.

## Warning Acceptance Criteria

### Info

- Used for non-risk education or status.
- Does not require confirmation.

### Caution

- Used for meaningful review prompts.
- Requires user review before continuing.

### Warning

- Used for elevated risk.
- Requires explicit confirmation.

### Critical

- Used for likely loss, compromise, or irreversible risk.
- Requires extra friction or safer path.

### Blocked by Policy

- Used when account or organization policy refuses the action.
- Explains what must change before the action can continue.

## MVP UX Gate

Before engineering continues, the UX package should answer:

- What does the user see when creating the Qubitor Account?
- How does the user receive funds?
- How does the user know their address stays stable?
- How does the user know whether an action is hybrid, PQ-ready, PQ-native, legacy, or compatibility mode?
- How does the user recover?
- How does the user rotate keys?
- How does the user revoke dapp permissions?
- How does the user review a bridge route?
- How does a developer inspect raw details?
