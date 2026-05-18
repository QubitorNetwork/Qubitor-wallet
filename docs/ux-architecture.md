# UX Architecture

## Primary Navigation

### Home

Daily wallet dashboard.

Required content:

- Qubitor Account label
- Qubitor Network `0x` smart account address
- Copy address button
- QR code access
- Security mode badge
- Quantum readiness status
- Total balance
- Chain selector
- Quick actions: Send, Receive, Bridge, Apps, Security
- Recent activity
- Security alerts
- Recovery status
- Connected app status

Address card copy:

> Your Qubitor Network 0x smart account.

### Assets

Token, NFT, and asset risk management.

Required content:

- Token balances
- NFT gallery
- Chain filter
- Hidden or spam assets
- Bridged asset status
- Unknown token warnings
- Approval exposure per asset

### Activity

Complete transaction and security event history.

Activity event types:

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

Every activity detail page must show:

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

### Security

Control center for account posture and quantum readiness.

Sections:

- Account Type: show that the account is a Qubitor `0x` smart account.
- Validation Mode: Smart Account Ready, Hybrid Protected, PQ Ready, or PQ Native.
- Post-Quantum Layer: configured, pending, disabled, or active.
- Key Rotation: rotate keys while keeping the same `0x` account address.
- Recovery: configure recovery without changing account identity.
- Connected Apps: permissions and session keys granted from the Qubitor account.
- Approval Risk: token approvals and stale spenders.
- Bridge Readiness: supported routes and legacy route warnings.

### Apps

Dapp connection and permission management.

Required content:

- Connected apps
- Domain
- Verified or unverified status
- Account connected
- Chain
- Permissions
- Session limits
- Spending limits
- Last used
- Security mode
- Revoke button
- Compatibility mode warning when needed

### Bridge

Asset movement between supported Qubitor Network environments and future approved EVM routes.

Required content:

- Source chain
- Destination chain
- Source Qubitor `0x` smart account
- Destination account
- Asset
- Amount
- Route
- Fees
- Estimated time
- Bridge security status
- Finality stage
- Explorer links
- Failure handling

### Settings

Wallet preferences and advanced configuration.

Required content:

- Account labels
- Network settings
- Privacy settings
- Notification settings
- Developer mode
- Security preferences
- Recovery preferences
- Export options
- App lock
- Biometric or passkey settings, if applicable

## Secondary Areas

### Migration Center

Migration should exist, but it should not be the product's center of gravity.

Required content:

- Connected legacy wallet
- Qubitor Account destination
- Asset inventory
- Approval inventory
- Dapp connections
- Chain balances
- NFTs
- Migration checklist
- Risk warnings

### Recovery Center

Required content:

- Recovery status
- Recovery method
- Recovery strength
- Guardians or devices
- Recovery delay
- Last tested
- Backup status
- Recommended improvements

### Key Rotation Center

Required content:

- Current key modules
- Last rotation date
- Recommended rotation interval
- Key health
- Legacy key exposure
- Available replacement methods
- Before-and-after summary

Key rotation copy:

> Your Qubitor address stays the same. Only the security keys behind it are being updated.

### Quantum Readiness Report

Required sections:

- Account type
- Signature mode
- Recovery status
- Key rotation status
- Legacy EOA dependency
- Dapp permissions
- Token approvals
- Bridge readiness
- Chain compatibility
- Session key exposure
- Governance or treasury risk, if applicable
- Honest boundary section

## Critical Confirmation Screens

### Transaction Review

Every transaction must show:

- From: Qubitor `0x` smart account
- To address or contract
- Human-readable action summary
- Asset movement preview
- Estimated fee
- Simulation result
- Security mode used
- Signature or validation method used
- Risk warnings if needed
- Advanced raw details expandable

### Message Signing Review

Every signing request must show:

- Requesting app
- Domain
- Account
- Chain
- Message type
- Human-readable summary
- Risk level
- Security mode
- Raw data expandable

### Dapp Connection Request

Every connection request must show:

- Dapp name
- Domain
- Verified or unverified status
- Requested chain
- Requested account
- Permissions requested
- Compatibility mode status
- Session duration
- Spending limits, if requested

Actions:

- Connect
- Connect with limited session
- Reject
- Advanced permissions
