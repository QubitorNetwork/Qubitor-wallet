# UX Map and Information Architecture

## UX Scope

This map defines Qubitor Wallet as a UX-only product architecture. It does not define final visual styling, animation, brand polish, or frontend implementation.

Core UX invariant:

> Every user receives a normal EVM-compatible `0x` address. That address is a Qubitor smart account. Quantum readiness comes from the account validation layer, not the address format.

## Product Areas

### Onboarding

Purpose: create, explain, or recover a Qubitor Account.

Screens:

- Welcome
- Create Qubitor Account
- Connect Existing Wallet
- Recover Account
- Generating Account
- Your `0x` Address
- Security Setup
- Recovery Setup
- Setup Summary

Primary modals:

- What is a smart account?
- Why a normal `0x` address?
- What does hybrid protection mean?
- Recovery method details
- Advanced address derivation details

Required outcomes:

- User sees their Qubitor `0x` smart account address.
- User understands it works with supported EVM apps.
- User understands it is not a traditional private-key-only wallet.
- User is prompted to set up hybrid protection and recovery before significant use.

### Home

Purpose: daily wallet dashboard.

Primary content:

- Qubitor Account label
- `0x` smart account address
- Copy address button
- QR code entry point
- Security mode badge
- Quantum readiness status
- Total balance
- Chain selector
- Quick actions
- Recent activity
- Security alerts
- Recovery status
- Connected app summary

Quick actions:

- Send
- Receive
- Bridge
- Apps
- Security

Secondary states:

- Empty account
- Funded account
- Recovery missing
- Security action recommended
- Compatibility mode active
- Account not deployed yet
- Balance fetch failed

### Assets

Purpose: review balances, NFTs, bridged assets, and approval exposure.

Primary content:

- Token balances
- NFT gallery placeholder for MVP
- Chain filter
- Hidden or spam assets
- Bridged asset status
- Unknown token warnings
- Approval exposure per asset

Secondary flows:

- Hide asset
- Reveal hidden asset
- Review approval
- Revoke approval
- Open asset activity

### Activity

Purpose: unified audit trail.

Activity types:

- Transaction sent
- Asset received
- Contract interaction
- Message signed
- Dapp connected
- Dapp revoked
- Approval granted
- Approval revoked
- Session key created
- Session key revoked
- Key rotated
- Recovery changed
- Bridge started
- Bridge completed
- Security warning
- Account module changed

Activity detail content:

- Plain summary
- Time
- Account
- Chain
- App or domain
- Security mode
- Transaction hash, if any
- Explorer link
- Raw details expandable
- Related warnings

### Security Center

Purpose: control account posture and quantum readiness.

Top-level sections:

- Account Type
- Validation Mode
- Post-Quantum Layer
- Recovery
- Key Rotation
- Connected Apps
- Approval Risk
- Bridge Readiness
- Readiness Report

Required entry points:

- Enable hybrid protection
- Configure recovery
- Test recovery
- Rotate keys
- Start emergency rotation
- Review connected apps
- Review approvals
- Open readiness report

### Apps

Purpose: manage dapp access, sessions, and permissions.

Primary content:

- Connected apps
- Domain
- Verified or unverified status
- Account connected
- Chain
- Permissions
- Session limits
- Spending limits
- Last used
- Risk level
- Security mode
- Revoke button
- Compatibility warning when needed

Primary modals:

- Dapp connection request
- Advanced permissions
- Session key setup
- Permission edit
- Revoke confirmation

### Bridge

Purpose: move assets between supported Qubitor Network environments and future approved EVM routes while exposing route trust.

Primary content:

- Source chain
- Destination chain
- Asset
- Amount
- Source Qubitor `0x` smart account
- Destination account
- Route
- Fees
- Estimated time
- Bridge security status
- Progress timeline
- Failure recovery

Route labels:

- Legacy bridge route
- Hybrid protected route
- PQ-ready route
- Qubitor native route

### Developer Mode

Purpose: expose implementation details without burdening normal users.

Primary content:

- Smart account address
- Account factory address
- EntryPoint address if using ERC-4337
- Implementation contract
- Validation modules
- Recovery modules
- UserOperation preview
- Bundler endpoint
- Paymaster endpoint
- Simulation trace
- Raw calldata
- Signature payloads
- Module upgrade history
- Export tools

Access rule:

Developer Mode is hidden from normal users until explicitly enabled in Settings or via an advanced details entry point.

## Global Modal Inventory

Critical confirmations:

- Transaction Review
- Message Signing Review
- Dapp Connection Request
- Session Key Creation
- Key Rotation Review
- Emergency Rotation Review
- Recovery Start
- Recovery Complete
- Bridge Route Review
- Approval Revoke
- Account Module Change

Educational modals:

- Smart account explanation
- Hybrid protection explanation
- PQ readiness boundary
- Stable `0x` address explanation
- Compatibility mode explanation
- Bridge risk explanation
- Recovery explanation
- Key rotation explanation

## Navigation Model

Primary nav:

- Home
- Assets
- Activity
- Security
- Apps
- Bridge
- Settings

Secondary nav inside Security:

- Overview
- Validation
- Recovery
- Key Rotation
- Apps and Approvals
- Readiness Report
- Advanced

Secondary nav inside Developer Mode:

- Account
- UserOperation
- Modules
- Simulation
- Logs
- Exports

## Role-Based UX Depth

Normal user:

- Sees simple explanations and action-first screens.
- Does not see algorithm names by default.
- Sees badges, warnings, recovery prompts, and readable transaction summaries.

Power user:

- Can inspect validation module, UserOperation, approvals, compatibility mode, and raw payloads.

Developer:

- Can inspect account abstraction details, simulation traces, bundler/paymaster data, and export debug JSON.

Protocol or treasury operator:

- Later sees policy, thresholds, timelocks, role approvals, audit trails, and readiness reports.

## MVP IA Boundary

In MVP:

- Include smart account onboarding.
- Include stable `0x` address explanation.
- Include hybrid protection setup.
- Include recovery setup.
- Include send/receive.
- Include transaction and signing review.
- Include connected apps.
- Include Security Center.
- Include Quantum Readiness Report.
- Include basic bridge placeholder.
- Include Developer Mode.

Not in MVP:

- Swap
- Fiat onramp
- Advanced portfolio analytics
- Full treasury workspace
- Full governance workspace
- Mobile-only flows
