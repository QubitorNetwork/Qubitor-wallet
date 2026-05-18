# Contract Architecture

## Core Invariant

Every Qubitor user receives a normal EVM-compatible `0x` address.

That address is an EVM smart account. Quantum readiness is implemented through account validation modules, not through a new address format.

## Current Contracts

### `QubitorAccount`

The user's stable smart account.

Responsibilities:

- Hold the stable `0x` account identity.
- Track the active validation module.
- Track the current security mode.
- Support EIP-1271-style signature checks.
- Execute calls through the current control key in the first slice.
- Execute scoped session-key calls through `SessionKeyModule`.
- Rotate the control key without changing the account address.
- Apply recovery without changing the account address.

### `QubitorAccountFactory`

Deterministic account deployment.

Responsibilities:

- Predict Qubitor Account addresses with `CREATE2`.
- Deploy accounts at the predicted address.
- Configure the initial hybrid validator.
- Configure the initial recovery policy.
- Return the existing account if it has already been deployed.

### `SecurityModeRegistry`

Security posture registry.

Responsibilities:

- Record a smart account's current security mode.
- Provide canonical labels for security modes.

### `HybridSignatureValidator`

Hybrid validation module.

Responsibilities:

- Validate the classical signer.
- Validate a placeholder PQ-ready proof commitment.
- Represent the `Hybrid Protected` security state.

Important limitation:

> The PQ proof in this module is a testable placeholder. It is not production post-quantum cryptography.

### `PostQuantumValidator`

PQ-ready validation placeholder.

Responsibilities:

- Validate a PQ-ready proof commitment.
- Represent a future PQ-ready validation path.

Important limitation:

> This module proves the account architecture can swap validation logic without changing the public `0x` account address. It does not claim production PQ security yet.

### `RecoveryModule`

Recovery policy module.

Responsibilities:

- Configure guardian recovery.
- Start recovery with a delay.
- Complete recovery by rotating the account control key.
- Keep the public account address unchanged.

### `SessionKeyModule`

Scoped session permission module.

Responsibilities:

- Add session keys with target, selector, value, and expiry constraints.
- Revoke session keys.
- Validate session execution requests.

## Security Modes

The contracts use the shared `QubitorTypes.SecurityMode` enum:

- `Legacy`
- `SmartAccountReady`
- `HybridProtected`
- `PQReady`
- `PQNative`

## Next Contract Work

- Add ERC-4337 `validateUserOp`.
- Replace direct control-key administration with account validation flows.
- Add multi-guardian recovery thresholds.
- Add real session spend accounting.
- Define production PQ validator interface.
- Add bridge authorization module.
- Add protocol and treasury policy modules.
