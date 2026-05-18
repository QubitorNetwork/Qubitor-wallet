# Low-Fidelity Wireframes

These wireframes define structure, hierarchy, and required content. They are not final UI design.

## Global Shell

```text
+------------------------------------------------------------------+
| Top bar: Account switcher | Chain selector | Alerts | Settings   |
+----------------------+-------------------------------------------+
| Primary nav          | Current screen                             |
| - Home               |                                           |
| - Assets             |                                           |
| - Activity           |                                           |
| - Security           |                                           |
| - Apps               |                                           |
| - Bridge             |                                           |
| - Settings           |                                           |
|                      |                                           |
| Account posture      |                                           |
| [Hybrid Protected]   |                                           |
+----------------------+-------------------------------------------+
```

Rules:

- The account switcher always identifies the active Qubitor Account.
- The address is always a normal `0x` address.
- Security posture is visible without opening Settings.
- Developer Mode is not visible unless enabled.

## Welcome

```text
+------------------------------------------------------+
| Qubitor Wallet                                      |
| A smart wallet built for Qubitor Network's          |
| post-quantum account model.                         |
|                                                      |
| Create a Qubitor Account with a normal              |
| EVM-compatible 0x address and smarter               |
| security underneath.                                |
|                                                      |
| [Create Qubitor Account]                            |
| [Connect Existing Wallet]                           |
| [Recover Account]                                   |
|                                                      |
| Learn how Qubitor protects you                      |
+------------------------------------------------------+
```

UX intent:

- Lead with familiar account creation.
- Do not start with cryptography.
- Make recovery available without making it dominant.

## Create Qubitor Account

```text
+------------------------------------------------------+
| Create your Qubitor Account                         |
|                                                      |
| Your Qubitor Account uses a normal EVM-compatible   |
| 0x address. The difference is that it                |
| is controlled by programmable smart-account          |
| security instead of a traditional single-key model.  |
|                                                      |
| Account model                                       |
| - Address format: 0x...                             |
| - Type: EVM smart account                           |
| - Control: smart-account validation                 |
|                                                      |
| [Create account]                                    |
| Advanced address details                            |
+------------------------------------------------------+
```

UX intent:

- Introduce the address model before showing the address.
- Mention smart account once in plain language.
- Keep derivation details behind disclosure.

## Generating Account

```text
+------------------------------------------------------+
| Creating your Qubitor Account                       |
|                                                      |
| Step 1  Deriving Qubitor 0x address                 |
| Step 2  Preparing smart-account validation           |
| Step 3  Checking recovery options                    |
|                                                      |
| This usually takes a few seconds.                    |
+------------------------------------------------------+
```

States:

- Deriving address
- Preparing account
- Network retry
- Failed

## Your 0x Address

```text
+------------------------------------------------------+
| Your Qubitor 0x Account                             |
|                                                      |
| This is your Qubitor smart account address. It uses |
| a normal 0x format while Qubitor validation secures |
| account actions underneath.                         |
|                                                      |
| +----------------------------------------------+     |
| | 0x71A9...F6c2                                |     |
| | [Copy] [QR] [Explorer]                       |     |
| +----------------------------------------------+     |
|                                                      |
| [Continue to Security Setup]                         |
+------------------------------------------------------+
```

UX intent:

- Make the `0x` address the user's identity anchor.
- Make copy and QR obvious.
- State that stronger security is underneath, not in the address itself.

## Security Setup

```text
+------------------------------------------------------+
| Secure your Qubitor Account                         |
|                                                      |
| Current state                                       |
| [Smart Account Ready]                               |
|                                                      |
| Recommended next step                               |
| Enable hybrid protection to reduce dependence on     |
| legacy wallet signatures where supported.            |
|                                                      |
| Hybrid protection                                   |
| Current EVM-compatible security + a                  |
| future-ready authorization layer.                    |
|                                                      |
| [Enable Hybrid Protection]                           |
| [Do this later]                                      |
+------------------------------------------------------+
```

Warnings:

- If skipped, show Security action recommended on Home.
- Do not block account creation.

## Recovery Setup

```text
+------------------------------------------------------+
| Set up recovery                                     |
|                                                      |
| Before you move significant funds, set up recovery. |
| Recovery helps protect your account if you lose a   |
| device, rotate keys, or need to replace an old      |
| security layer.                                     |
|                                                      |
| Choose recovery method                              |
| ( ) Guardian recovery                               |
| ( ) Multi-device recovery                           |
| ( ) Hardware-assisted recovery                      |
| ( ) Passkey-assisted recovery                       |
| ( ) Advanced recovery policy                        |
|                                                      |
| Recovery strength: Strong                           |
| [Set up recovery] [Skip for now]                    |
+------------------------------------------------------+
```

UX intent:

- Treat recovery as central, not buried.
- Let users skip, but make the risk visible.

## Setup Summary

```text
+------------------------------------------------------+
| Your Qubitor Account is ready                       |
|                                                      |
| Account address                                     |
| 0x71A9...F6c2                                       |
|                                                      |
| Security mode                                       |
| [Hybrid Protected]                                  |
|                                                      |
| Recovery                                            |
| Strong recovery active                              |
|                                                      |
| First actions                                       |
| [Receive funds] [Connect app] [Open Security]       |
+------------------------------------------------------+
```

## Home

```text
+------------------------------------------------------------------+
| Qubitor Account | 0x71A9...F6c2 | [Copy] | [Hybrid Protected]    |
+------------------------------------------------------------------+
| Balance                       | Quantum readiness                 |
| $26,656.61                    | 74/100 Hybrid Protected          |
|                               | Some apps may use compatibility  |
+-------------------------------+----------------------------------+
| Quick actions                                                     |
| [Send] [Receive] [Bridge] [Apps] [Security]                      |
+------------------------------------------------------------------+
| Security alerts                    | Recent activity              |
| - Compatibility boundary           | - Hybrid module enabled      |
| - Rotation window upcoming         | - Dapp connected             |
| - Legacy bridge route available    | - Recovery tested            |
+------------------------------------------------------------------+
```

Acceptance:

- Shows address, security mode, readiness, balance, alerts, and activity.
- Recovery/security actions must be visible from first viewport.

## Receive

```text
+------------------------------------------------------+
| Receive                                             |
|                                                      |
| Qubitor Account                                     |
| 0x71A9...F6c2                                       |
| [Copy] [QR]                                         |
|                                                      |
| Network                                             |
| [Qubitor Sepolia v]                                 |
|                                                      |
| Your Qubitor Account is a normal 0x address with    |
| smarter security underneath.                        |
|                                                      |
| Warning area if selected chain has limited support. |
+------------------------------------------------------+
```

## Send

```text
+------------------------------------------------------+
| Send from your Qubitor 0x smart account             |
|                                                      |
| Asset                                                |
| [USDC v]                                            |
|                                                      |
| Recipient                                            |
| [0x...]                                             |
|                                                      |
| Amount                                               |
| [500.00]                                            |
|                                                      |
| Network                                              |
| [Qubitor Sepolia v]                                 |
|                                                      |
| Recipient checks                                    |
| - Address format valid                              |
| - New address warning                               |
|                                                      |
| [Continue to review]                                |
+------------------------------------------------------+
```

## Transaction Review

```text
+------------------------------------------------------+
| Review transaction                                  |
| [Hybrid Protected]                                  |
|                                                      |
| You are approving QubiSwap to spend up to 500 USDC. |
|                                                      |
| From       Qubitor Account 0x71A9...F6c2            |
| To         QubiSwap contract 0x4f2B...B73C          |
| Fee        Sponsored by app paymaster               |
| Simulation Expected to succeed                      |
| Validation Hybrid EVM + PQ-ready validation path    |
|                                                      |
| Asset movement                                      |
| No assets move now. Future spending limited to      |
| 500 USDC.                                           |
|                                                      |
| [Advanced details]                                  |
| [Reject] [Confirm]                                  |
+------------------------------------------------------+
```

Required:

- Never confirm raw hex only.
- Always show security mode.
- Always show simulation result or simulation unavailable warning.

## Message Signing Review

```text
+------------------------------------------------------+
| Review signature request                            |
| [Warning] Permit signature                          |
|                                                      |
| App        ExampleSwap                              |
| Domain     app.example                              |
| Account    Qubitor Account 0x71A9...F6c2            |
| Chain      Qubitor Testnet                          |
|                                                      |
| This signature may allow the app to spend tokens    |
| from your account.                                  |
|                                                      |
| Security mode: Compatibility Mode                   |
|                                                      |
| [Raw data]                                          |
| [Reject] [Sign]                                     |
+------------------------------------------------------+
```

## Security Center

```text
+------------------------------------------------------------------+
| Security Center                                                   |
| Quantum readiness comes from how your account validates actions.  |
+------------------------------------------------------------------+
| Account Type          | Validation Mode                           |
| Qubitor 0x smart acct | Hybrid Protected                          |
+-----------------------+------------------------------------------+
| Post-Quantum Layer    | Recovery                                 |
| Configured w/bounds   | Strong recovery active                   |
+-----------------------+------------------------------------------+
| Key Rotation                                                   >  |
| Your Qubitor address stays the same. Only keys update.            |
+------------------------------------------------------------------+
| Connected Apps | Approval Risk | Bridge Readiness | Report        |
+------------------------------------------------------------------+
```

## Quantum Readiness Report

```text
+------------------------------------------------------+
| Quantum Readiness Report                            |
| [Hybrid Protected] 74/100                           |
|                                                      |
| Protected                                           |
| - Qubitor Account validation                        |
| - Recovery                                          |
| - Key rotation                                      |
|                                                      |
| Partially protected                                 |
| - External dapp message signing                     |
| - Bridge route fallback                             |
|                                                      |
| Still legacy or external                            |
| - External route dependency                         |
| - Unsupported dapp compatibility                    |
|                                                      |
| Recommended actions                                 |
| [Review apps] [Rotate key] [Review bridge routes]   |
+------------------------------------------------------+
```

## Apps

```text
+------------------------------------------------------+
| Connected Apps                                      |
|                                                      |
| QubiSwap                         [Verified]         |
| app.qubiswap.test                                   |
| Chain: Qubitor L2 Preview                           |
| Session: 24 hours                                   |
| Spend limit: 250 USDC/day                           |
| Permissions: Read balance, request swaps            |
| [Edit permissions] [Revoke]                         |
|                                                      |
| Legacy Market                    [Unverified]       |
| Compatibility Mode                                  |
| [Warning text]                                      |
| [Edit permissions] [Revoke]                         |
+------------------------------------------------------+
```

## Dapp Connection Request

```text
+------------------------------------------------------+
| Connect app                                         |
|                                                      |
| ExampleSwap                                         |
| app.example                                         |
| [Unverified]                                        |
|                                                      |
| Wants to connect                                    |
| Account: Qubitor Account 0x71A9...F6c2              |
| Chain: Qubitor Testnet                              |
|                                                      |
| Requested permissions                               |
| - Read address                                      |
| - Request signatures                                |
| - Request transactions                              |
|                                                      |
| Compatibility mode may be required.                 |
|                                                      |
| [Advanced permissions]                              |
| [Reject] [Connect limited session] [Connect]        |
+------------------------------------------------------+
```

## Bridge

```text
+------------------------------------------------------+
| Bridge                                              |
|                                                      |
| Source       Qubitor Testnet                        |
| Destination  Qubitor Devnet                         |
| Asset        QBT                                    |
| Amount       1,000                                  |
|                                                      |
| Account identity                                    |
| Source       Qubitor Account 0x71A9...F6c2          |
| Destination  Same Qubitor 0x smart account          |
|                                                      |
| Route        Hybrid protected route                 |
| Fee          $3.82                                  |
| Time         8-12 min                               |
|                                                      |
| [Review route]                                      |
+------------------------------------------------------+
```

## Bridge Progress

```text
+------------------------------------------------------+
| Bridge progress                                     |
|                                                      |
| [x] Preparing transaction                           |
| [x] Source transaction submitted                    |
| [ ] Source finalized                                |
| [ ] Bridge message detected                         |
| [ ] Destination pending                             |
| [ ] Destination finalized                           |
| [ ] Complete                                        |
|                                                      |
| [View source explorer] [View destination explorer]  |
+------------------------------------------------------+
```

## Key Rotation

```text
+------------------------------------------------------+
| Rotate keys                                         |
|                                                      |
| Your Qubitor address stays the same. Only the       |
| security keys behind it are being updated.          |
|                                                      |
| Before                                              |
| Hybrid validation key v1                            |
|                                                      |
| After                                               |
| Hybrid validation key v2                            |
|                                                      |
| Compatibility impact                                |
| 1 app may need reconnecting.                        |
|                                                      |
| [Cancel] [Rotate key]                               |
+------------------------------------------------------+
```

## Recovery Center

```text
+------------------------------------------------------+
| Recovery Center                                     |
|                                                      |
| Status       Strong recovery active                 |
| Method       Guardian recovery                      |
| Threshold    2 of 3                                 |
| Delay        48 hours                               |
| Last tested  Yesterday                              |
|                                                      |
| [Test recovery] [Edit guardians] [Advanced policy]  |
+------------------------------------------------------+
```

## Developer Mode

```text
+------------------------------------------------------+
| Developer Mode                                      |
|                                                      |
| Account                                             |
| Smart account address 0x71A9...F6c2                 |
| Factory address       0xFaC7...9413                 |
| EntryPoint            0x4337...0007                 |
|                                                      |
| Modules                                             |
| Validation           HybridSignatureValidator       |
| Recovery             GuardianRecoveryModule         |
| Session keys         SessionKeyModule               |
|                                                      |
| Transaction debug                                  > |
| UserOperation                                      > |
| Simulation trace                                  > |
|                                                      |
| [Export account JSON] [Export debug JSON]           |
+------------------------------------------------------+
```
