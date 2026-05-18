# Qubitor

Qubitor is a Qubitor Network wallet with EVM-compatible `0x` smart-account addresses and PQ-native validation.

The product direction is defined by the Quanta Wallet UX master prompt and the 0x Smart Account Address Model:

- Every user receives a normal EVM-compatible `0x` address on Qubitor Network.
- That address represents an EVM smart account, not a legacy EOA.
- Quantum readiness lives in smart account validation logic, not in a new address format.
- The public account identity stays stable through recovery, key rotation, and security upgrades.
- The wallet must be honest about legacy, hybrid, PQ-ready, PQ-native, and external dependency boundaries.

## Repository Layout

This is a pnpm + Turborepo monorepo:

```
apps/
├── mobile/        Expo + React Native + TypeScript (primary product)
├── desktop/       Tauri v2 shell — macOS / Windows / Ubuntu (wraps the mobile web export)
└── extension/     Plasmo + React + TypeScript (browser dapp surface)

packages/
├── contracts/     Foundry / Solidity smart account contracts
├── core/          @qubitor/core         — account model, security states, warnings
├── keystore/      @qubitor/keystore     — platform key-vault seam (mobile/desktop/web)
├── ui-tokens/     @qubitor/ui-tokens    — design tokens (colors, spacing, typography, badges)
├── wallet-policy/ @qubitor/wallet-policy — dapp permissions, session keys, warning rules
└── evm/           @qubitor/evm          — viem helpers, chain config, AA seam

docs/              UX documentation (see below)
```

## Getting Started

Prerequisites:

- Node.js ≥ 20
- pnpm ≥ 10
- Foundry (`forge`) for the contracts package

Install workspace dependencies:

```sh
pnpm install
```

Run the mobile app:

```sh
pnpm dev:mobile
```

Run the browser extension:

```sh
pnpm dev:extension
```

Run the desktop app (needs Rust + Linux webkit2gtk deps — see
[`apps/desktop/README.md`](apps/desktop/README.md)):

```sh
pnpm --filter @qubitor/desktop dev
```

Type-check everything:

```sh
pnpm typecheck
```

Build / test contracts:

```sh
pnpm forge:build
pnpm forge:test
```

## Brand

The wallet apps share the **Qubitor Network** brand: dark `qb-black` (`#050505`) background, `qb-bone` (`#ededed`) text, hairline `qb-line` dividers, Space Grotesk display / Inter body / JetBrains Mono labels. Tokens mirror the Qubitor Network website `apps/web/app/globals.css` `@theme` block. See [`docs/visual-specs.md`](docs/visual-specs.md) for the full palette and component table.

## Current Build Status

This slice ships a UI-first foundation plus Qubitor Devnet/Testnet integration. The mobile wallet can read QBT balance/deployment/readiness state from a running Qubitor Network node, request faucet QBT, deploy the Quanta Account through the PQ submitter, sign `executeMessage(...)` locally with ML-DSA-65, and relay a real `executePQ` transfer as `QubitorPQTxV1`.

What's real:

- Monorepo structure, type-checked shared packages.
- All 17 mobile screens from the SWallet adaptation brief, navigable via Expo Router.
- Browser extension popup and options shell, with a stub EIP-1193 provider.
- Foundry contracts compile and tests pass at `packages/contracts/`.
- Qubitor chain config: Devnet `91337`, Testnet `91338`, QBT gas coin, RPC gateway, faucet, and PQ raw transaction submitter.
- Live mobile reads for QBT balance, deployment state, readiness, and `PQ Native` status.
- Wallet-owned devnet ML-DSA key generation, secure native storage, account deployment, and PQ transfer relay.

What's mocked:

- Production backup/recovery for PQ keys
- Activity indexing
- Dapp connections
- Recovery / rotation transitions
- Bundler / paymaster flows outside Qubitor Devnet

Run the Qubitor devnet stack first:

```sh
cd ../QubitorNetwork
pnpm devnet:start
pnpm rpc:start
pnpm faucet:start
pnpm pq-relayer:start
```

Then run the mobile app with `apps/mobile/.env.example` values.

For Qubitor Testnet, use the testnet env template:

```sh
cp apps/mobile/.env.testnet.example apps/mobile/.env
pnpm dev:mobile
```

The shared defaults are:

```text
EXPO_PUBLIC_QUBITOR_CHAIN_ID=91338
EXPO_PUBLIC_QUBITOR_RPC_URL=https://testrpc.qubitor.org/rpc
EXPO_PUBLIC_QUBITOR_FAUCET_URL=https://testrpc.qubitor.org
EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL=https://testrpc.qubitor.org
```

Run the wallet acceptance flow against testnet with:

```sh
pnpm mobile:testnet-acceptance
```

Run the browser-extension standalone wallet acceptance flow against testnet with:

```sh
pnpm extension:testnet-acceptance
```

To create a wallet-owned PQ treasury vault profile for Qubitor testnet faucet custody, run the wallet CLI against the testnet PQ relayer:

```sh
EXPO_PUBLIC_QUBITOR_CHAIN_ID=91338 \
EXPO_PUBLIC_QUBITOR_RPC_URL=https://testrpc.qubitor.org/rpc \
EXPO_PUBLIC_QUBITOR_FAUCET_URL=https://testrpc.qubitor.org \
EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL=https://testrpc.qubitor.org \
pnpm wallet:pq-vault:generate
```

Add `-- --deploy` after the script command to deploy the Quanta Account immediately. The JSON output contains `env.QUBITOR_FAUCET_TREASURY_VAULT`; put that address into the Qubitor Network service environment, for example `../QubitorNetwork/.env.testnet.local` in a sibling checkout. Store the JSON privately because it includes the ML-DSA private key that controls the vault.

Each screen with multiple states exposes a "State: …" cycle button at the bottom so design review can flip through the States / Warnings / Edge cases listed in the brief.

## UX Documentation

- [Product Brief](docs/product-brief.md)
- [UX Map](docs/ux-map.md)
- [UX Architecture](docs/ux-architecture.md)
- [User Flows](docs/user-flows.md)
- [MVP Flow Specification](docs/mvp-flow-spec.md)
- [Low-Fidelity Wireframes](docs/low-fidelity-wireframes.md)
- [SWallet UI Adaptation](docs/swallet-ui-adaptation.md)
- [Screen Requirements](docs/screen-requirements.md)
- [UX Acceptance Criteria](docs/ux-acceptance-criteria.md)
- [Copy Library](docs/copy-library.md)
- [Security State System](docs/security-state-system.md)
- [Data Model](docs/data-model.md)
- [Risk and Warning System](docs/risk-warning-system.md)
- [Implementation Plan](docs/implementation-plan.md)

## Contracts

Smart account scaffolding lives in `packages/contracts/`.

- [Contract Architecture](docs/contract-architecture.md)
