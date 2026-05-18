# SWallet UI Adaptation for Qubitor

## How to Use This File

This file is the primary brief for a UI generator producing the Qubitor mobile screens. The SWallet source export remains the visual and structural reference; this file specifies what changes for Qubitor.

Feed alongside this file:

- `docs/screen-requirements.md` — per-screen states, warnings, data fields, edge cases
- `docs/mvp-flow-spec.md` — flow logic and exit states
- `docs/copy-library.md` — canonical strings

Do not invent new visual tokens. Pull color, typography, spacing, and component primitives from the SWallet source file.

## Source UI

Use the downloaded SWallet community file as Quanta Wallet's visual and structural base.

Figma references:

- Design layout: `KNRomjqw02l9iFPb4MoN74`, node `0:1`
- Sketch and wireframes: `KNRomjqw02l9iFPb4MoN74`, node `501:1451`
- UI Kit: `KNRomjqw02l9iFPb4MoN74`, node `403:2`

Local export:

`<local SWallet export directory>/SWallet [Crypto Wallet MultiApp] (v.2) (Community)`

Available screens:

- `First connect.png`
- `Add number.png`
- `Enter code.png`
- `Create passcode.png`
- `Repeat a passcode.png`
- `Key phrase.png`
- `Add picture and name.png`
- `Loading screen.png`
- `Figger print.png`
- `Enter a passcode.png`
- `Loading screen (2).png`
- `Main screen.png`
- `Main screen (NFT).png`
- `Wallet analytics.png`
- `Wallet analytics (transactions).png`
- `Send tokens.png`
- `Receive.png`
- `Transactions.png`
- `Payment example.png`
- `Wallets.png`
- `DApps.png`
- `Setting.png`

## Figma Build Status

The Qubitor adaptation frames have been created in Figma.

Write target:

- Page: `Sketch and wireframes`
- Node: `501:1451`

Created section:

- `Qubitor UX - SWallet Adaptation`

Created frames:

- `Qubitor / 01 Welcome` — `711:6`
- `Qubitor / 02 Your 0x Address` — `711:25`
- `Qubitor / 03 Home` — `711:55`
- `Qubitor / 04 Receive` — `711:113`
- `Qubitor / 05 Send` — `711:430`
- `Qubitor / 06 Transaction Review` — `711:453`
- `Qubitor / 07 Security Center` — `711:485`
- `Qubitor / 08 Readiness Report` — `711:528`
- `Qubitor / 09 Apps` — `711:553`
- `Qubitor / 10 Dapp Connection` — `711:599`
- `Qubitor / 11 Bridge` — `711:631`
- `Qubitor / 12 Recovery + Rotation` — `711:660`
- `Qubitor / 13 Developer Mode` — `711:685`

Reserved frame names (not yet created in Figma — node IDs to be assigned when added):

- `Qubitor / 14 Activity`
- `Qubitor / 15 Accounts`
- `Qubitor / 16 Message Signing Review`
- `Qubitor / 17 Existing Wallet Connection`

Untouched source pages:

- `Design layout`
- `UI Kit`
- `Old v1`

## Visual Direction

Qubitor should inherit SWallet's mobile product feel:

- 412 x 892 mobile frames
- White app background
- Manrope typography
- Large 32px page titles
- 16px horizontal page margins
- Soft light-gray cards
- Rounded card corners
- Bright green primary action color
- Dark neutral text
- Bottom mobile navigation
- Minimal icon-forward actions
- Large QR-centered receive screen
- Search-led dapp screen
- Simple list-led settings screen

Observed source style:

- Background: white
- Surface cards: light gray around `#F2F2F2`
- Primary action: bright green around `#61FF98`
- Text: dark neutral around `#363537`
- Muted text: mid gray around `#7E7E7F`
- Typography: Manrope for app UI, Roboto for device status text

## Product Adaptation Principle

Keep SWallet's familiar crypto wallet rhythm, but change the product model:

SWallet:

> A general crypto wallet with balances, tokens, payments, wallets, dapps, and settings.

Qubitor:

> A smart-account-first Qubitor Network wallet where the user's normal EVM-compatible `0x` address is controlled by programmable validation, recovery, key rotation, and quantum-ready security states.

The UI should not become dense, enterprise, or protocol-console-like. Keep the SWallet simplicity and add Qubitor security meaning in concise cards, badges, and review screens.

## Screen Mapping

MVP status legend:

- **Kept** — generator should produce a Qubitor frame for this screen.
- **Optional** — generator may produce if time allows; not required for MVP.
- **Skipped** — not in MVP scope; do not produce a Qubitor frame.

| SWallet Screen | Qubitor Screen | MVP Status | Adaptation |
| --- | --- | --- | --- |
| `First connect` | Welcome / Create Quanta Account | Kept | Replace generic connect with Quanta Account creation. |
| `Add number` | Optional identity setup | Skipped | Phone identity not central to MVP onboarding. |
| `Enter code` | Verification / recovery contact verification | Skipped | Only used if phone/email recovery is enabled, not in MVP. |
| `Create passcode` | Create app passcode | Kept | Local app lock, retained as onboarding step. |
| `Repeat a passcode` | Confirm app passcode | Kept | Confirms passcode set above. |
| `Key phrase` | Recovery setup education | Kept | Replace seed phrase framing with smart-account recovery. |
| `Add picture and name` | Account label setup | Optional | Use for naming the Quanta Account when time allows. |
| `Loading screen` | Generating Quanta Account | Kept | Show deriving `0x` smart account address. |
| `Main screen` | Home | Kept | Show Quanta Account, balance, security badge, readiness, quick actions. |
| `Main screen (NFT)` | Assets / NFTs | Skipped | Asset view deferred past MVP. |
| `Wallet analytics` | Quantum Readiness Report | Kept | Replace market analytics with readiness coverage. |
| `Wallet analytics (transactions)` | Activity analytics | Kept | Used by Activity tab for security/activity filters. |
| `Send tokens` | Send | Kept | Add recipient checks and security mode preview. |
| `Receive` | Receive Qubitor `0x` Address | Kept | Keep QR-first layout, update copy and address model. |
| `Transactions` | Activity | Kept | Include transactions and security events. |
| `Payment example` | Transaction Review / Message Signing Review | Kept | Reused for both transaction and signature review. |
| `Wallets` | Accounts | Kept | Show Quanta Account and any legacy/watch-only accounts. |
| `DApps` | Apps | Kept | Add permission, session key, compatibility labels. |
| `Setting` | Settings / Security entry points | Kept | Add Security Center, Recovery, Developer Mode. |

Onboarding screen order (cross-checked against `mvp-flow-spec.md` § "New Quanta Account Onboarding"):

1. Welcome (`First connect` → Welcome)
2. Create app passcode (`Create passcode`)
3. Confirm app passcode (`Repeat a passcode`)
4. Recovery setup education (`Key phrase` → Recovery setup education)
5. Account label setup (`Add picture and name`) — Optional
6. Generating Quanta Account (`Loading screen`)
7. Your 0x Address (`Receive` style)
8. Security Setup prompt (entry to Security Center)
9. Recovery Setup prompt (entry to Recovery + Rotation)
10. Setup Summary (sub-section of Welcome, see screen 1)
11. Home (`Main screen` → Home)

## Navigation & Information Architecture

Use SWallet bottom navigation as the base, but rename destinations for Qubitor.

Bottom nav (5 items, replacing SWallet's Main / Payments / Wallets / DApps / Settings):

1. Home
2. Activity
3. Accounts
4. Apps
5. Security

Home quick actions (4):

1. Send
2. Receive
3. Bridge
4. Secure

Security Center subpages (6):

1. Readiness Report
2. Recovery
3. Key Rotation
4. Connected Apps
5. Approvals
6. Developer Mode

Notes:

- Bridge is a Home quick action, not a bottom nav tab, in MVP. This keeps the nav within the five-item SWallet structure.
- Settings remains available inside Security or as a secondary row until there is enough preference depth to justify a separate tab.

## Core Mobile Screen Set

These are the Qubitor screens that should be designed first in the SWallet style.

### 1. Welcome / Create Quanta Account

Based on:

- `First connect.png`
- `Loading screen.png`

Required content:

- Quanta Wallet title
- Short product promise
- Primary action: Create Quanta Account
- Secondary action: Recover Account
- Tertiary: Connect Existing Wallet
- Explanation that Qubitor uses a normal EVM-compatible `0x` address on Qubitor Network

States:

- Default
- Unsupported browser
- Network unavailable
- Ready to create
- Deriving address
- Deploying
- Counterfactual address ready
- Failed

Warnings:

- Infrastructure unavailable
- Unsupported network
- Account creation failed

Edge cases:

- User has an existing local account
- User opens wallet from a dapp connection request
- Required account infrastructure is temporarily unavailable
- Address derived but not deployed
- Factory unavailable
- User rejects authorization

Recommended copy:

> Your Quanta Account is a normal 0x address with smarter security underneath.

UI treatment:

- Use SWallet's large illustration area.
- Replace generic wallet art with a simple smart-account card concept.
- Avoid technical module language on first screen.

#### 1a. Setup Summary (onboarding sub-screen)

Shown once between Recovery Setup and Home (onboarding step 10 in `mvp-flow-spec.md`). Not a recurring destination.

Required content:

- Account label
- Qubitor `0x` address (shortened)
- Security mode badge (e.g. Smart Account Ready, Hybrid Protected)
- Recovery status (configured / skipped)
- Continue to Home action

UI treatment:

- Use a single summary card on a clean background.
- Match Welcome's calm tone, no warnings unless recovery was skipped.
- If recovery was skipped, show one inline warning row before the CTA.

### 2. Your 0x Address

Based on:

- `Receive.png`

Required content:

- Title: Your 0x Address
- Quanta Account label
- Shortened address
- QR code
- Copy action
- Network selector action
- Share action
- Security badge
- Stable-address explanation

States:

- Counterfactual
- Deployed
- Copy success
- QR expanded

Warnings:

- Network-specific deposit warning
- Counterfactual address explanation if account is not deployed yet

Edge cases:

- Explorer link unavailable before deployment
- User tries to receive on unsupported chain

Recommended copy:

> This is your Qubitor smart account address. It uses a normal `0x` format while Qubitor's programmable validation controls security underneath.

UI treatment:

- Keep the large QR center.
- Use three square actions underneath: Copy, Network, Share.
- Add one calm info card near the bottom explaining stable address behavior.

### 3. Home

Based on:

- `Main screen.png`

Required content:

- Greeting or account label
- Profile/avatar
- Balance
- Qubitor `0x` address
- Security mode badge
- Readiness score
- Quick actions: Send, Receive, Bridge, Secure
- Security alerts
- Token cards

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

Edge cases:

- Multiple accounts
- Multiple chains
- Hidden balances enabled
- Account not deployed

Recommended top card:

- Label: Quanta Account
- Address: `0x71A9...F6c2`
- Badge: Hybrid Protected
- Score: 74/100

UI treatment:

- Replace the Wallet/NFT hero cards with a single Quanta Account summary card or two cards: Account and Security.
- Keep token cards near the bottom.
- Keep Home screen light and scan-friendly.

### 4. Send

Based on:

- `Send tokens.png`

Required content:

- From: Qubitor `0x` smart account
- Asset input
- Recipient input
- Amount input
- Network selector
- Recipient checks
- Continue to Review action

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

Edge cases:

- Token exists on multiple chains
- Gas token missing
- Name-service resolution conflict, if supported later

Required warning copy:

> Address format valid. Recipient is new, so review carefully before continuing.

UI treatment:

- Keep SWallet's stacked inputs.
- Add one warning/status card before the CTA.

### 5. Transaction Review

Based on:

- `Payment example.png`

Required content:

- Action summary
- From account
- To address or contract
- Asset movement preview
- Fee
- Simulation result
- Security mode
- Validation method
- Warning area
- Confirm and Reject actions

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

Edge cases:

- Simulation unavailable
- Paymaster fails
- Bundler rejects UserOperation

Recommended copy:

> This transaction uses your Qubitor smart account validation.

UI treatment:

- Use a receipt-style summary.
- Put the security badge near the title.
- Keep raw details hidden behind an advanced row.

### 6. Receive

Based on:

- `Receive.png`

Same as `Your 0x Address`, but entered from Home after onboarding.

Title:

> Receive

Subtitle:

> Quanta Account

States:

- Default
- QR expanded
- Copy success
- Unsupported chain selected

Warnings:

- Chain may not support all Qubitor security features
- Asset may not exist on selected network

Edge cases:

- Counterfactual account
- Different address model on unsupported external systems

### 7. Security Center

Based on:

- `Setting.png`
- `Wallet analytics.png`

Required sections:

- Account Type
- Validation Mode
- Post-Quantum Layer
- Recovery
- Key Rotation
- Connected Apps
- Approval Risk
- Bridge Readiness
- Readiness Report
- Developer Mode

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

Edge cases:

- Security module update pending
- Policy prevents change
- Chain does not support requested mode

UI treatment:

- Use Settings-style rows for navigation.
- Use one top readiness card like the Analytics card.
- Keep rows 48-56px tall.

### 8. Quantum Readiness Report

Based on:

- `Wallet analytics.png`
- `Wallet analytics (transactions).png`

Required content:

- Current state label
- Readiness score
- Protected
- Partially protected
- Legacy / external dependencies
- Recommended actions

UI treatment:

- Replace investment analytics with security readiness.
- Use a segmented/stacked bar for coverage.
- Use list cards for boundaries.

### 9. Apps

Based on:

- `DApps.png`

Required content:

- Search
- Connected app categories
- Verified/unverified labels
- Permission summaries
- Session limits
- Compatibility mode labels
- Revoke entry point

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

Edge cases:

- App domain changed
- Session key expired
- Revocation transaction required

UI treatment:

- Keep the DApps grid.
- Use small badges for `Verified`, `Limited`, `Compatibility`.
- Add a warning card for external dependency risks.

### 10. Dapp Connection Request

Based on:

- `DApps.png`
- `Payment example.png`

Required content:

- App name
- Domain
- Verified status
- Requested account
- Requested chain
- Permissions
- Session duration
- Compatibility status
- Connect, Connect Limited, Reject

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

Edge cases:

- App requests unsupported chain
- App requests legacy signing
- User has multiple accounts

UI treatment:

- Use app card header.
- Use receipt-style details.
- Keep actions bottom-aligned.

### 11. Bridge

Based on:

- `Send tokens.png`
- `Payment example.png`

Required content:

- Source chain
- Destination chain
- Asset
- Amount
- Source Qubitor account
- Destination account
- Route security label
- Fee
- Estimated time
- Route trust warning

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

Edge cases:

- Insufficient destination gas
- Claim required
- Route changes mid-flow

UI treatment:

- Use stacked inputs like Send.
- Use receipt-style route review before confirm.

### 12. Recovery and Key Rotation

Based on:

- `Setting.png`
- `Key phrase.png`

Required content:

- Recovery status
- Recovery method
- Threshold
- Delay
- Last tested
- Test recovery action
- Key rotation action
- Stable address explanation

States (sourced from `mvp-flow-spec.md` § Recovery Setup and § Key Rotation):

- Recovery active
- Recovery skipped
- Recovery incomplete
- Rotation pending
- Rotation complete
- Rotation failed
- Rotation cancelled by user

Warnings:

- Recovery not configured
- Recovery threshold too low
- Recovery delay disabled
- Removing all recovery methods
- Rotation may affect some apps
- Compatibility mode may be required on unsupported chains
- Emergency rotation freezes sessions where supported

Recommended copy:

> Your Qubitor address stays the same. Only the security keys behind it are being updated.

UI treatment:

- Do not use seed phrase as the main recovery metaphor.
- Use recovery policy cards and checklist rows.

### 13. Developer Mode

Based on:

- `Setting.png`
- `Wallet analytics (transactions).png`

Required content:

- Smart account address
- Account factory
- EntryPoint
- Validation module
- Recovery module
- Session key module
- UserOperation details
- Bundler
- Paymaster
- Export debug JSON

States:

- Disabled
- Enabled
- Transaction debug
- Export ready
- Logs unavailable

Warnings:

- Advanced details
- Raw payload could be misread

Edge cases:

- Account not deployed
- Bundler unavailable
- Paymaster unavailable

UI treatment:

- Hidden behind Settings/Security.
- Use compact rows and expandable technical sections.

### 14. Activity

Based on:

- `Transactions.png`
- `Wallet analytics (transactions).png`

Required content:

- Filter controls (event type)
- Transaction rows (send, receive, swap, bridge)
- Security event rows (recovery configured, key rotated, dapp connected, security mode changed, session key created)
- Each row: icon, summary, timestamp, security mode badge where applicable
- Tap-through to detail

States:

- Empty (no activity yet)
- Mixed transactions and security events
- Filtered to transactions only
- Filtered to security events only
- Loading
- Fetch failed

Warnings:

- Security warning rows (e.g. broad approval detected)
- Failed transaction surfaced inline

Edge cases:

- Pending transactions at top
- Multi-chain activity merged in one list
- Counterfactual account (no on-chain history yet)

Recommended copy:

> Transactions and security events for your Quanta Account.

UI treatment:

- Use SWallet's transactions list as the row foundation.
- Small icon per event type; use Qubitor green only for confirmed states.
- Security-mode badge on the right of transaction rows.

### 15. Accounts

Based on:

- `Wallets.png`

Required content:

- Qubitor smart account row (primary)
- Legacy / watch-only / connected external wallet rows
- Per row: account label, shortened `0x`, security mode badge, balance summary
- Primary row action: Open
- Secondary actions: Set as primary, Hide
- Add account entry point

States:

- Single Qubitor account (default)
- Multiple Qubitor accounts
- Mixed (Qubitor + legacy + watch-only)
- Account not deployed

Warnings:

- Legacy account dependency
- Watch-only account cannot sign

Edge cases:

- User has only legacy accounts (prompt to create Quanta Account)
- Account on unsupported chain
- Hidden balances enabled

Recommended copy:

> Your Quanta Account, plus any legacy or watch-only wallets you have connected.

UI treatment:

- Reuse SWallet's wallet-list rows.
- Distinguish smart account from legacy/watch-only with the security-mode badge — do not introduce a new color.
- Add account CTA at the top right or bottom row.

### 16. Message Signing Review

Based on:

- `Payment example.png`

Required content:

- Requesting app name and domain
- Verified status
- Message type (Login, Permit, Order, Governance, Unknown typed data, Raw)
- Risk level header
- Human-readable summary
- Security mode
- Raw payload expandable
- Sign and Reject actions

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

Edge cases:

- Cannot decode message
- Signature expired
- Unsupported signing method

Recommended copy:

> This signature may authorize actions outside this screen. Only continue if you trust this app and understand the request.

UI treatment:

- Receipt-style like Transaction Review.
- Risk-level header above the human-readable summary, not buried below.
- Raw payload collapsed by default; expand reveals monospace block.

### 17. Existing Wallet Connection

Based on:

- `First connect.png`

Used when the user picks "Connect Existing Wallet" on Welcome (screen 1).

Required content:

- Provider list (e.g. MetaMask, Rabby, Coinbase Wallet, WalletConnect)
- Short explanation that the existing wallet creates or controls a Qubitor smart account
- Optional migration scan toggle
- Connect action per provider
- Cancel / back to Welcome

States:

- Provider list
- Provider connecting
- Provider connected
- Provider rejected
- Provider unsupported

Warnings:

- Existing wallet still controls the smart account
- Migration scan optional — not a guarantee of completeness

Edge cases:

- Multiple existing wallets installed
- WalletConnect timeout
- User has no existing wallet

Recommended copy:

> Use your existing wallet to create and control a smarter Quanta Account.

UI treatment:

- Simple provider list using SWallet's row style.
- After connection succeeds, hand off to screen 2 (Your 0x Address).
- Migration scan as a small toggle, not a separate step.

## Component Adaptation

### Cards

Use SWallet's light-gray rounded cards for:

- Account summary
- Readiness summary
- Security alerts
- Recovery status
- Dapp permission summary
- Bridge route summary

Avoid nested cards. If a card needs detail, use dividers or rows inside it.

### Badges

Qubitor needs badges for:

- Smart Account Ready
- Hybrid Protected
- PQ Ready
- PQ Native
- Compatibility Mode
- Legacy Route
- External Dependency
- Recovery Active
- Rotation Recommended

Badge style:

- Small pill
- 12-13px text
- Green for positive states
- Yellow for review states
- Orange for warning states
- Gray for neutral/external states

### Actions

Use icon-first square actions, matching SWallet:

- Copy
- QR
- Share
- Send
- Receive
- Bridge
- Secure
- Revoke
- Rotate
- Test

### Inputs

Use SWallet's 380x48 rounded input style for:

- Recipient address
- Amount
- Asset selector
- Network selector
- Search
- Dapp permission fields

### Review Screens

Use receipt-like detail rows:

- Label left
- Value right
- Warnings below details
- Primary action at bottom
- Secondary reject/cancel action nearby

## Screen Copy Replacements

Replace seed-phrase-heavy copy with smart-account recovery language.

Avoid:

> Save your seed phrase.

Prefer:

> Set up recovery before moving significant funds.

Replace generic wallet naming with:

> Quanta Account

Replace generic address labels with:

> Qubitor Network 0x smart account

Replace generic analytics with:

> Quantum Readiness Report

Replace generic dapp browsing with:

> Connected apps and permissions

## Figma Build Instructions

For later iteration:

1. Open file `KNRomjqw02l9iFPb4MoN74`.
2. Use page `Sketch and wireframes`, node `501:1451`.
3. Iterate the existing Qubitor frames at 412 x 892.
4. Keep frame names:
   - `Qubitor / 01 Welcome`
   - `Qubitor / 02 Your 0x Address`
   - `Qubitor / 03 Home`
   - `Qubitor / 04 Receive`
   - `Qubitor / 05 Send`
   - `Qubitor / 06 Transaction Review`
   - `Qubitor / 07 Security Center`
   - `Qubitor / 08 Readiness Report`
   - `Qubitor / 09 Apps`
   - `Qubitor / 10 Dapp Connection`
   - `Qubitor / 11 Bridge`
   - `Qubitor / 12 Recovery + Rotation`
   - `Qubitor / 13 Developer Mode`
   - `Qubitor / 14 Activity`
   - `Qubitor / 15 Accounts`
   - `Qubitor / 16 Message Signing Review`
   - `Qubitor / 17 Existing Wallet Connection`
5. Reuse UI Kit primitives where possible:
   - Device top/bottom
   - Bottom menu
   - Buttons
   - Inputs
   - Cards
   - Icons
6. Keep the `Design layout` page untouched.
7. Keep the `UI Kit` page untouched.

## UX Checks Before Final UI

- Does every address surface show a normal `0x` address?
- Does every security surface clarify that quantum readiness comes from validation?
- Does every sensitive action show a security mode?
- Does key rotation say the address stays the same?
- Does recovery avoid seed-phrase-only mental models?
- Does Apps show permissions and revocation?
- Does Bridge show route trust?
- Does Developer Mode stay hidden until requested?
- Does Activity show security events alongside transactions?
- Does Accounts distinguish smart accounts from legacy/watch-only?
- Does Message Signing Review show message type and risk level above raw payload?
