# Screen Requirements

Each screen should preserve the same core model: the user has a Quanta Account, the account has a standard `0x` EVM address, and the security posture comes from smart-account validation.

## Welcome

Purpose: introduce Quanta Wallet without overwhelming the user.

Primary user goal: understand what they are creating and start safely.

Main components:

- Product statement
- Create Quanta Account action
- Connect existing wallet action
- Recover account action
- Learn more link

Required copy:

> Welcome to Quanta Wallet. A smart wallet built for Qubitor Network's post-quantum account model.

> Create a Quanta Account with a normal EVM-compatible 0x address and smarter security underneath.

Data needed:

- Supported networks
- Feature flags for recovery, passkeys, hybrid setup, and developer mode

States:

- Default
- Unsupported browser
- Network unavailable

Warnings:

- None by default

Actions:

- Create Quanta Account
- Connect existing wallet
- Recover account
- Learn how Qubitor protects you

Edge cases:

- User has an existing local account
- User opens wallet from a dapp connection request
- Required account infrastructure is temporarily unavailable

## Create Quanta Account

Purpose: create or derive a Qubitor smart account.

Primary user goal: get a usable EVM-compatible `0x` address on Qubitor Network.

Main components:

- Short smart account explanation
- Address model explanation
- Create action
- Advanced deployment details expandable

Required copy:

> Your Quanta Account uses a normal EVM-compatible 0x address on Qubitor Network. The difference is that it is controlled by programmable smart-account security instead of a traditional single-key wallet model.

Data needed:

- Account factory address
- Chain ID
- Salt or derivation input
- Initial validation mode
- Deployment status

States:

- Ready to create
- Deriving address
- Deploying
- Counterfactual address ready
- Failed

Warnings:

- Infrastructure unavailable
- Unsupported network
- Account creation failed

Actions:

- Create account
- Retry
- View advanced details

Edge cases:

- Address derived but not deployed
- Factory unavailable
- User rejects authorization

## Your 0x Address

Purpose: anchor the user's public account identity.

Primary user goal: understand and copy their address.

Main components:

- Quanta Account label
- Full or shortened `0x` address
- Copy button
- QR code
- Security mode badge
- Explorer link when deployed

Required copy:

> This is your Quanta Wallet address. It uses a normal EVM-compatible 0x format, but it is secured by smart-account validation.

Data needed:

- Account address
- Chain
- Deployment status
- Security mode

States:

- Counterfactual
- Deployed
- Copy success
- QR expanded

Warnings:

- Network-specific deposit warning
- Counterfactual address explanation if account is not deployed yet

Actions:

- Copy address
- Show QR code
- Open explorer
- Continue to security setup

Edge cases:

- Explorer link unavailable before deployment
- User tries to receive on unsupported chain

## Home Dashboard

Purpose: daily wallet dashboard.

Primary user goal: check account, balance, readiness, and recent activity.

Main components:

- Address card
- Balance summary
- Security mode badge
- Quantum readiness status
- Chain selector
- Quick actions
- Recent activity
- Alerts

Required copy:

> Your Qubitor Network 0x smart account.

Data needed:

- Account
- Assets
- Activity events
- Notifications
- Security state
- Recovery state
- Connected apps summary

States:

- Empty account
- Funded account
- Recovery incomplete
- Security action recommended
- Loading balances
- Balance fetch failed

Warnings:

- No recovery configured
- Legacy dependency detected
- Compatibility mode active
- Suspicious approval detected

Actions:

- Send
- Receive
- Bridge
- Apps
- Security
- Copy address

Edge cases:

- Multiple accounts
- Multiple chains
- Hidden balances enabled
- Account not deployed

## Security Center

Purpose: manage account posture and quantum readiness.

Primary user goal: understand and improve account security.

Main components:

- Account type
- Validation mode
- Post-quantum layer
- Recovery
- Key rotation
- Connected apps
- Approval risk
- Readiness report link

Required copy:

> Quantum readiness comes from how your Quanta Account validates actions, not from the address format itself.

Data needed:

- Smart account metadata
- Validation modules
- Recovery modules
- Key modules
- Dapp connections
- Approvals
- Readiness report

States:

- Smart Account Ready
- Hybrid Protected
- PQ Ready
- PQ Native
- Recovery missing
- Rotation recommended

Warnings:

- Recovery not configured
- Legacy EOA dependency
- Broad dapp permissions
- PQ layer disabled

Actions:

- Enable hybrid protection
- Configure recovery
- Rotate keys
- Review apps
- Review approvals
- Open readiness report

Edge cases:

- Security module update pending
- Policy prevents change
- Chain does not support requested mode

## Send

Purpose: send assets safely.

Primary user goal: transfer funds with readable review and simulation.

Main components:

- Asset selector
- Recipient input
- Amount input
- Network selector
- Fee preview
- Continue action

Required copy:

> Send from your Qubitor 0x smart account.

Data needed:

- Assets
- Contacts
- Chain support
- Fee estimates
- Recipient checks

States:

- Editing
- Invalid recipient
- Insufficient funds
- Simulation pending
- Ready for review

Warnings:

- New address
- Similar recent address
- Sending to contract
- Unsupported destination chain

Actions:

- Continue
- Save recipient
- Cancel

Edge cases:

- Token exists on multiple chains
- Gas token missing
- Name-service resolution conflict, if supported later

## Transaction Review

Purpose: prevent blind signing.

Primary user goal: understand exactly what will happen before approving.

Main components:

- Human-readable summary
- From and to
- Asset movement preview
- Fee
- Simulation result
- Security mode
- Validation method
- Warnings
- Advanced details

Required copy:

> This transaction uses your Qubitor smart account validation.

Data needed:

- Transaction draft
- Simulation result
- Security mode
- UserOperation data if applicable
- Warnings

States:

- Simulation succeeded
- Simulation failed
- Compatibility mode
- Policy blocked
- Awaiting confirmation

Warnings:

- Legacy signing
- Unexpected asset movement
- Broad approval
- Contract revert
- Policy blocked

Actions:

- Confirm
- Reject
- Edit
- View raw details

Edge cases:

- Simulation unavailable
- Paymaster fails
- Bundler rejects UserOperation

## Receive

Purpose: let users receive assets to the right address.

Primary user goal: copy or share the Qubitor `0x` account address.

Main components:

- Quanta Account label
- Address
- QR code
- Copy button
- Chain selector
- Deposit compatibility note

Required copy:

> Your Quanta Account is a normal 0x address with smarter security underneath.

Data needed:

- Account address
- Supported chains
- Chain security labels
- Deployment status

States:

- Default
- QR expanded
- Copy success
- Unsupported chain selected

Warnings:

- Chain may not support all Qubitor security features
- Asset may not exist on selected network

Actions:

- Copy address
- Share QR
- Select network

Edge cases:

- Counterfactual account
- Different address model on unsupported external systems

## Apps

Purpose: manage dapp access.

Primary user goal: see and revoke permissions.

Main components:

- Connected app list
- Permission summary
- Session key status
- Spending limits
- Last used
- Revoke action

Required copy:

> Connected apps can request actions from your Quanta Account. Review permissions and revoke anything you no longer use.

Data needed:

- Dapp connections
- Session keys
- Permissions
- Risk levels
- Activity timestamps

States:

- No connected apps
- Active sessions
- Stale apps
- Broad permissions

Warnings:

- Broad permissions
- High spend limit
- Unknown app
- Compatibility mode

Actions:

- Revoke
- Edit permissions
- Open app details

Edge cases:

- App domain changed
- Session key expired
- Revocation transaction required

## Dapp Connection Request

Purpose: let users consent to app access with scope.

Primary user goal: connect safely or reject.

Main components:

- App name
- Domain
- Verification status
- Requested account
- Requested chain
- Permissions
- Session options
- Compatibility status

Required copy:

> This app wants to connect to your Quanta Account.

Data needed:

- Request origin
- Requested permissions
- Chain
- Account
- Domain reputation

States:

- Verified app
- Unverified app
- Compatibility mode required
- Unsupported request

Warnings:

- Domain mismatch
- Unknown app
- Broad permissions
- Compatibility mode

Actions:

- Connect
- Connect with limited session
- Reject
- Advanced permissions

Edge cases:

- App requests unsupported chain
- App requests legacy signing
- User has multiple accounts

## Message Signing Review

Purpose: classify and explain signing requests.

Primary user goal: avoid dangerous blind signatures.

Main components:

- Requesting app
- Domain
- Message type
- Summary
- Risk level
- Security mode
- Raw payload expandable

Required copy:

> This signature may authorize actions outside this screen. Only continue if you trust this app and understand the request.

Data needed:

- Signature payload
- Typed data parser result
- Domain
- Risk classification
- Security mode

States:

- Login
- Permit
- Order
- Governance vote
- Unknown typed data
- Raw message
- High risk
- Blocked by policy

Warnings:

- Permit can move funds
- Domain mismatch
- Raw hex
- Unknown typed data

Actions:

- Sign
- Reject
- View raw data

Edge cases:

- Cannot decode message
- Signature expired
- Unsupported signing method

## Bridge

Purpose: move assets while disclosing route security.

Primary user goal: bridge assets to the intended account and chain.

Main components:

- Source chain
- Destination chain
- Source account
- Destination account
- Asset
- Amount
- Route
- Fees
- Time estimate
- Security status

Required copy:

> The bridge uses your Qubitor 0x smart account as your bridge identity where supported.

Data needed:

- Routes
- Supported assets
- Fees
- Finality estimates
- Account addresses
- Route security labels

States:

- Route available
- Route unavailable
- Legacy route
- Hybrid route
- PQ-ready route
- Pending
- Complete
- Failed

Warnings:

- Legacy bridge route
- Unsupported asset
- Bridge paused
- Destination finalization delayed

Actions:

- Review route
- Confirm bridge
- Track transfer
- Retry or claim

Edge cases:

- Insufficient destination gas
- Claim required
- Route changes mid-flow

## Developer Mode

Purpose: expose implementation details for builders and power users.

Primary user goal: inspect account abstraction and validation internals.

Main components:

- Smart account address
- Account factory
- EntryPoint
- Implementation contract
- Validation modules
- UserOperation preview
- Bundler endpoint
- Paymaster endpoint
- Simulation logs
- Raw calldata
- Export tools

Required copy:

> Developer Mode shows raw account and transaction details. Normal users do not need these fields to use Qubitor safely.

Data needed:

- Smart account metadata
- Chain config
- UserOperation
- Simulation traces
- Gas estimates
- Module history

States:

- Disabled
- Enabled
- Transaction debug
- Export ready
- Logs unavailable

Warnings:

- Advanced details
- Raw payload could be misread

Actions:

- Toggle Developer Mode
- Export account metadata
- Export transaction debug JSON
- View module history

Edge cases:

- Account not deployed
- Bundler unavailable
- Paymaster unavailable
