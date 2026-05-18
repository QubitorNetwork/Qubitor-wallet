# Product Brief

## Product Thesis

Qubitor Wallet is a smart-account-first Qubitor Network wallet designed for post-quantum-ready account control. It gives every user a familiar EVM-compatible `0x` address while using programmable account validation underneath.

The wallet should feel familiar to EVM wallet users, but structurally it should support:

- Smart contract accounts
- Account abstraction
- Modular validation
- Hybrid signatures
- Post-quantum-ready validation paths
- Key rotation without changing the public address
- Recovery without changing the public address
- Session keys and dapp permission scopes
- Transaction simulation and readable signing
- Bridge and protocol readiness

## Positioning

Qubitor Wallet gives users a familiar EVM-style `0x` address on Qubitor Network, but the account is controlled by programmable smart-account security designed for post-quantum readiness.

Preferred language:

- Quantum-ready
- Post-quantum-ready
- Hybrid protected
- Smart-account-first
- Future-ready account security
- Designed for Qubitor Network's post-quantum account model

Avoid language:

- Quantum-proof forever
- Impossible to hack
- 100% quantum safe
- Fully unbreakable
- Complete quantum immunity

## Core Requirement

Qubitor Wallet must use standard EVM-compatible `0x` addresses. Quantum readiness must come from the smart account validation layer, not from changing the address format.

## Non-Goals

- Do not create a new address format.
- Do not introduce non-`0x` user addresses.
- Do not present Qubitor Wallet as an EOA wallet.
- Do not imply that every `0x` address is quantum-ready.
- Do not claim full quantum resistance unless every relevant signing path is post-quantum or hybrid protected.
- Do not make legacy wallet migration the center of the product.

## Account Model

Primary account name: `Qubitor Account`

Address format: `0x...`

Address type: EVM smart account

Control model: Smart contract validation logic

Default user identity: The Qubitor smart account address

User-facing explanation:

> Your Qubitor Account uses a normal EVM-compatible 0x address on Qubitor Network. The difference is that it is controlled by programmable smart-account security instead of a traditional single-key wallet model.

Technical explanation:

> Qubitor Wallet uses EVM-compatible smart contract accounts. Each account is represented by a standard 20-byte EVM address displayed with the 0x prefix. Quantum readiness is implemented through modular validation logic, allowing hybrid signatures, post-quantum verification modules, key rotation, recovery rules, and future PQ-native account modes.

## Address Requirements

- Must use `0x` addresses.
- Must be EVM-compatible.
- Must work with contracts, explorers, supported dapps, and supported bridges.
- Must support counterfactual address derivation.
- Must allow the same public address to upgrade security modules.
- Must not require users to understand address derivation.

## Success Criteria

- Every Qubitor user receives a normal EVM-compatible `0x` address.
- The Qubitor account is clearly presented as a smart account.
- The user understands that quantum readiness comes from validation logic, not address format.
- The same `0x` address can remain stable through key rotation, recovery, and security upgrades.
- The wallet supports hybrid and post-quantum-ready account modes.
- The wallet remains compatible with supported EVM chains, dapps, explorers, and bridges.
- The UX feels familiar to EVM wallet users while introducing Qubitor's stronger account model.
