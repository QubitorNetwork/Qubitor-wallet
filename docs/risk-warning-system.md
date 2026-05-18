# Risk and Warning System

## Principles

- Warnings should be calm, specific, and actionable.
- The wallet should explain what happened, why it matters, what the user can do, and whether funds are at risk.
- Warning level should map to user action, not emotional intensity.
- Critical language should be reserved for real risk.

## Levels

### Info

Purpose: teach or clarify without implying danger.

Tone: neutral and helpful.

Used when:

- A transaction is sponsored.
- An account is counterfactual and will deploy on first use.
- A chain supports only some Qubitor features.
- A dapp requests a normal read-only connection.

Required user action: none.

Example:

> This transaction is sponsored, so you do not need native gas for this action.

### Caution

Purpose: highlight a meaningful detail the user should review.

Tone: calm and advisory.

Used when:

- Recipient is new.
- Network has weaker Qubitor support.
- App may need compatibility mode.
- Recovery setup is incomplete.
- Session key has moderate spend limits.

Required user action: review before continuing.

Example:

> This network may not support all Qubitor security features. Some actions may use compatibility mode.

### Warning

Purpose: indicate elevated risk or a potentially harmful action.

Tone: firm and clear.

Used when:

- User signs unknown typed data.
- User grants a broad token approval.
- Dapp is unverified and requests spend permissions.
- Bridge route depends on legacy controls.
- Legacy wallet still controls the smart account.

Required user action: explicit confirmation.

Example:

> This action uses legacy signing. It may be compatible with classical EVM apps, but it is not fully post-quantum protected.

### Critical

Purpose: prevent likely loss, compromise, or irreversible account-risk changes.

Tone: direct without panic.

Used when:

- Transaction simulation shows unexpected asset loss.
- User removes all recovery methods.
- Recovery threshold is dangerously low.
- Message signature may move funds.
- Emergency rotation is recommended after suspected compromise.

Required user action: explicit confirmation with additional friction, or choose a safer path.

Example:

> This signature may authorize actions outside this screen. Only continue if you trust this app and understand the request.

### Blocked by Policy

Purpose: communicate that the account policy refuses the action.

Tone: precise and procedural.

Used when:

- Treasury policy blocks a transaction.
- Security policy blocks high-risk signature.
- Session key scope does not allow requested method.
- Bridge route is paused or unsupported.
- Recovery attempt fails threshold or delay requirements.

Required user action: change request, collect approvals, wait for delay, or update policy.

Example:

> This action is blocked by your account policy. Adjust the transaction or collect the required approvals before continuing.

## Required Warning Fields

Every warning must define:

- Level
- Title
- Body
- Trigger condition
- Required user action
- Whether funds are at risk
- Link to details when available

## Standard Copy Blocks

### Smart Account Explanation

> A smart account is a wallet with programmable security. It can rotate keys, add recovery, limit app permissions, and support future-ready signing methods without changing your public account address.

### Main Address Card

> This is your Qubitor smart account address. It uses a normal 0x format while Qubitor's programmable validation controls security underneath.

### Hybrid Protection

> Hybrid protection combines current EVM-compatible security with a future-ready authorization layer. It helps your account prepare for post-quantum account control while staying usable with supported apps.

### Legacy Mode

> This action uses legacy signing. It may be compatible with classical EVM apps, but it is not fully post-quantum protected.

### Compatibility Mode

> Compatibility mode helps Qubitor work with apps that do not fully support smart accounts yet. Some protections may be limited for these actions.

### Bridge Risk

> Bridges depend on the security of their operators, contracts, and message verification. Review the bridge security status before moving large amounts.

### Key Rotation

> Key rotation lets your account replace old authorization keys without changing your public smart account address.

### Stable Address

> Your Qubitor address stays the same. Only the security keys behind it are being updated.
