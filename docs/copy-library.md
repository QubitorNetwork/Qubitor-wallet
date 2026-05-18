# UX Copy Library

## Address Model

Simple:

> Your Qubitor Account is a normal 0x address with smarter security underneath.

Medium:

> Qubitor keeps EVM-compatible 0x addresses while upgrading the way accounts authorize transactions.

Technical:

> Your Qubitor Account is an EVM smart account. Its 0x address remains stable while its validation logic can support hybrid and post-quantum signature modules.

Address card:

> This is your Qubitor smart account address. It uses a normal 0x format while Qubitor's programmable validation controls security underneath.

## Smart Accounts

Short:

> A smart account is a wallet with programmable security.

Full:

> A smart account is a wallet with programmable security. It can rotate keys, add recovery, limit app permissions, and support future-ready signing methods without changing your public account address.

Stable identity:

> Your public Qubitor address stays the same while the security rules behind it can evolve.

## Hybrid Protection

Short:

> Hybrid protection adds a future-ready security layer to your Qubitor Account.

Full:

> Hybrid protection combines current EVM-compatible security with a future-ready authorization layer. It helps your account prepare for post-quantum account control while staying usable with supported apps.

Enabled:

> Hybrid protection is enabled. Your account uses current EVM-compatible security plus a future-ready security layer where supported.

Fallback:

> This action falls back to compatibility mode and may not receive full hybrid protection.

## Post-Quantum Readiness

PQ Ready:

> PQ Ready. This account has a post-quantum-ready authorization path where supported.

PQ Native:

> PQ Native on supported networks. This account can authorize supported actions without relying on a legacy EOA signature.

Boundary:

> Your account is protected by Qubitor-supported validation where available. Some apps, chains, or bridges may still require legacy compatibility mode.

Address clarification:

> The 0x address is not what makes the account quantum-ready. The account's validation logic provides the future-ready security path.

## Legacy and Compatibility

Legacy account:

> Legacy account security. This account still depends on a classical ECDSA signature model.

Legacy action:

> This action uses legacy signing. It may be compatible with classical EVM apps, but it is not fully post-quantum protected.

Compatibility mode:

> Compatibility mode helps Qubitor work with apps that do not fully support smart accounts yet. Some protections may be limited for these actions.

Legacy risk explanation:

> Your existing wallet may use a classical account model. Qubitor can help you use a smart account that supports recovery, key rotation, and future-ready security modules.

## Recovery

Setup prompt:

> Before you move significant funds, set up recovery.

Full explanation:

> Recovery helps you regain access if a device is lost, a key is replaced, or your account needs to rotate to a safer authorization method.

Guardian explanation:

> Guardians can help you recover your account, but they cannot spend your funds unless your recovery policy allows a recovery action to complete.

No recovery:

> Recovery is not set up yet. Add a recovery method before moving significant funds.

Test recovery:

> Test recovery lets you practice the process without replacing your keys.

## Key Rotation

Short:

> Rotate keys without changing wallets.

Full:

> Key rotation lets your account replace old authorization keys without changing your public smart account address.

Stable address:

> Your Qubitor address stays the same. Only the security keys behind it are being updated.

Emergency:

> Emergency rotation helps you replace risky keys, freeze sessions where supported, and review recent account activity.

## Transaction Simulation

Simulation success:

> Simulation completed. Review the expected asset movement before confirming.

Simulation unavailable:

> Simulation is unavailable right now. Review the transaction carefully before continuing.

Simulation failed:

> Simulation failed. This transaction may not complete as expected.

Unexpected movement:

> This transaction may move assets beyond the amount shown in the original request.

Smart account validation:

> This transaction uses your Qubitor smart account validation.

Hybrid transaction:

> This transaction is hybrid protected.

PQ-ready transaction:

> This transaction uses a post-quantum-ready validation path where supported.

## Message Signing

Login:

> This looks like a sign-in request.

Permit:

> This signature may allow an app to spend tokens from your account.

Raw message:

> This message cannot be clearly decoded. Only sign if you trust the app and understand the request.

High risk:

> This signature may authorize actions outside this screen. Only continue if you trust this app and understand the request.

## Dapp Permissions

Connection request:

> This app wants to connect to your Qubitor Account.

Connected apps:

> Connected apps can request actions from your Qubitor Account. Review permissions and revoke anything you no longer use.

Limited session:

> Limit this session by time, spending amount, allowed contracts, or allowed methods.

Revoke:

> Revoking this app removes its saved permissions. You can reconnect later if needed.

## Session Keys

Explanation:

> Session keys let an app perform limited actions under rules you approve.

Broad permissions:

> This session has broad permissions. Consider narrowing the duration, spend limit, or allowed actions.

No expiration:

> This session does not expire. Add an expiration date unless you need long-term access.

Revoked:

> Session key revoked.

## Bridge

Bridge identity:

> The bridge uses your Qubitor 0x smart account as your bridge identity where supported.

Hybrid route:

> This bridge route uses Qubitor's hybrid-protected controls where supported.

Legacy route:

> This route depends on legacy bridge controls. Review risk before moving large amounts.

General risk:

> Bridges depend on the security of their operators, contracts, and message verification. Review the bridge security status before moving large amounts.

Complete:

> Bridge complete. Assets arrived at the destination account.

Delayed:

> Destination finalization is taking longer than expected. Your transfer is still being tracked.

## Empty States

No assets:

> Your smart account is ready. Add funds, bridge assets, or receive assets at your Qubitor 0x address.

No recovery:

> Recovery is not set up yet. Add a recovery method before moving significant funds.

No connected apps:

> No apps are connected. When you connect to a dapp, you will be able to manage permissions here.

No activity:

> Your activity will appear here after you send, receive, sign, connect apps, or update account security.

## Notification Tone

Good:

> Review recommended: this app has broad permissions and has not been used recently.

Avoid:

> You are in danger.
