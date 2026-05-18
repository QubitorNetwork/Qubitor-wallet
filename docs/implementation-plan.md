# UX-First Implementation Plan

## Build Strategy

Qubitor should be specified UX-first before frontend or contract implementation continues.

The first milestone is a product UX package that lets designers, engineers, and security reviewers agree on:

- What a Qubitor Account is
- How a normal user creates and uses one
- How the stable `0x` smart account address is explained
- How security modes appear in every sensitive action
- How recovery, key rotation, dapp access, bridge trust, and compatibility mode are surfaced

No frontend is part of this milestone.

## Phase 0: UX Foundation

Status: in progress

Deliverables:

- Product brief
- UX architecture
- UX map and information architecture
- User flows
- MVP flow specification
- Screen requirements
- Screen acceptance criteria
- Copy library
- Security state system
- Data requirements
- Risk and warning hierarchy

Exit criteria:

- The product is clearly centered on a Qubitor `0x` smart account, not an EOA.
- The UX does not overclaim quantum resistance.
- Every primary flow shows the relevant security mode.
- Users can understand that the address stays the same while validation logic evolves.
- Recovery and key rotation are first-class flows.
- Dapp permissions, message signing, bridge routes, and external dependencies are explicitly reviewable.

## Phase 1: Low-Fidelity Product UX

Goal: produce low-fidelity wireframes or structured screen specs for every MVP screen.

Screens:

- Welcome
- Create Qubitor Account
- Generating Account
- Your `0x` Address
- Security Setup
- Recovery Setup
- Setup Summary
- Home
- Receive
- Send
- Transaction Review
- Message Signing Review
- Security Center
- Quantum Readiness Report
- Apps
- Dapp Connection Request
- Session Key Setup
- Activity
- Bridge
- Key Rotation
- Emergency Rotation
- Recovery Center
- Developer Mode
- Settings

Exit criteria:

- Each screen has purpose, required content, warnings, actions, empty states, error states, and edge cases.
- Every screen can be reviewed without relying on final visual design.
- The product can move into UI design with no major IA ambiguity.

## Phase 2: UX Validation

Goal: test whether the UX explains smart accounts and quantum-readiness boundaries clearly.

Validation questions:

- Does a normal user understand that their address is a normal EVM-compatible `0x` address?
- Does the user understand the account is not a traditional single-key wallet?
- Does the user understand that quantum readiness comes from validation logic, not the address itself?
- Can the user tell when an action is compatibility mode or legacy-only?
- Does recovery feel important without feeling scary?
- Does key rotation feel normal and address-stable?
- Can a power user find raw account and transaction details?

Artifacts:

- User testing script
- Task list
- Comprehension checklist
- Risk-language review
- UX issues backlog

## Phase 3: Engineering Handoff

Goal: translate approved UX into implementation tickets.

Handoff package:

- Screen-by-screen requirements
- Data requirements
- State machine definitions
- Event and activity taxonomy
- Warning policy table
- Copy library
- Open product decisions
- Contract and backend dependency list

Engineering should not implement production flows until Phase 0 and Phase 1 are approved.

## Parked Engineering Draft

Some early smart-account contract scaffolding exists in this repo as an engineering draft. It is not the current priority.

Before contract work resumes, the UX package should decide:

- Which security states need onchain representation
- Which events the wallet must index
- Which recovery and key rotation actions users must be able to understand
- Which compatibility boundaries need protocol-level metadata
- Which developer mode fields must be exposed
