# Security State System

## Principles

- Security posture is a measurable account state, not a marketing badge.
- Quantum readiness lives in validation logic, not address format.
- Every sensitive action must disclose which security mode is used.
- The wallet must distinguish account posture from external ecosystem dependencies.

## Account Security States

### Legacy

Meaning: the user is using a standard EOA or a smart account fully controlled by a classical EOA without additional protection.

Display copy:

> Legacy account security. This account still depends on a classical ECDSA signature model.

UX behavior:

- Show migration or smart account setup prompt.
- Warn before large deposits.
- Recommend Qubitor Account setup.
- Do not label actions as PQ-ready.

### Smart Account Ready

Meaning: the Qubitor account exists as a programmable `0x` smart account, but hybrid or post-quantum-ready protection has not been fully enabled.

Display copy:

> Smart account created. Enable hybrid protection to reduce dependence on legacy wallet signatures.

UX behavior:

- Prompt user to enable hybrid protection.
- Prompt recovery setup.
- Show account modules.
- Encourage security setup before large deposits.

### Hybrid Protected

Meaning: the account uses current EVM-compatible authorization plus a future-ready security layer where supported.

Display copy:

> Hybrid protected. Your account uses current EVM-compatible security plus a future-ready security layer.

UX behavior:

- Show positive badge.
- Explain that this is a migration mode.
- Clearly identify if any action falls back to classical-only signing.

### PQ Ready

Meaning: the account has post-quantum-capable validation modules available for supported actions.

Display copy:

> PQ Ready. This account has a post-quantum-ready authorization path where supported.

UX behavior:

- Show stronger security posture.
- Warn when interacting with legacy systems.
- Show compatibility boundaries.

### PQ Native

Meaning: supported actions no longer require dependence on classical-only authorization.

Display copy:

> PQ Native on supported networks. This account can authorize supported actions without relying on a legacy EOA signature.

UX behavior:

- Show strongest account posture.
- Clearly list supported networks and unsupported networks.
- Do not imply universal protection across all chains.

## Action-Level Badges

Use action-level badges on transaction review, message signing, dapp connection, bridge confirmation, key rotation, and recovery changes.

- Legacy Signed
- Smart Account Transaction
- Hybrid Protected
- PQ-Ready Path
- PQ-Native on Supported Network
- Compatibility Mode
- Recovery Protected
- Rotation Recommended
- Bridge Legacy Route
- Bridge Hybrid Route
- External Dependency

## Compatibility Mode

Meaning: an app, chain, bridge, or signing request requires a fallback path that does not use the full Qubitor protection model.

Display copy:

> Compatibility mode helps Qubitor work with apps that do not fully support smart accounts yet. Some protections may be limited for these actions.

## Stable Address Rule

The public Qubitor account address must remain stable across:

- Key rotation
- Recovery
- Validation module upgrades
- Hybrid protection setup
- PQ-ready validation setup
- Session key creation or revocation

Required copy:

> Your Qubitor address stays the same. Only the security keys behind it are being updated.

## Coverage Matrix

Advanced users should be able to inspect quantum-resistance coverage across these rows:

- User account signing
- Dapp message signing
- Transaction authorization
- Recovery
- Key rotation
- Session keys
- Bridge transaction
- Bridge admin path
- Sequencer/operator path
- Governance/treasury path
- Chain settlement dependency
- DA/proof dependency

Columns:

- Legacy
- Smart-account compatible
- Hybrid protected
- PQ-ready
- PQ-native
- Unsupported or external dependency
