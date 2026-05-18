# Mobile Navigation Map

Single source of truth for which screen reaches which screen in the Qubitor mobile prototype.

Conventions:

- **Entry points**: how the user gets here.
- **Exit points**: every interactive element with a destination.
- **TODO Phase 4+**: deferred past the UI prototype pass (real provider connection, file share, external links, etc.).

## Onboarding

### `/onboarding/welcome` — Welcome
- Entry points: app launch (via `app/index.tsx` → `Redirect`)
- Exit points:
  - Create Quanta Account → `/onboarding/passcode`
  - Recover Account → `/onboarding/recovery-education`
  - Connect Existing Wallet → `/connect-existing`

### `/onboarding/passcode` — Create app passcode
- Entry: Welcome
- Exit:
  - Continue → `/onboarding/confirm-passcode`
  - Back arrow → previous

### `/onboarding/confirm-passcode` — Confirm passcode
- Entry: passcode
- Exit:
  - Continue → `/onboarding/recovery-education`
  - Back arrow → previous

### `/onboarding/recovery-education` — Recovery setup education
- Entry: Welcome (recover) or confirm-passcode
- Exit:
  - Continue → `/onboarding/account-label`
  - Skip for now → `/onboarding/account-label`
  - Back arrow → previous

### `/onboarding/account-label` — Account label
- Entry: recovery-education
- Exit:
  - Continue → `/onboarding/generating`
  - Back arrow → previous

### `/onboarding/generating` — Generating Quanta Account
- Entry: account-label
- Exit:
  - Auto-redirect after 1.5s → `/onboarding/address`

### `/onboarding/address` — Your 0x Address
- Entry: generating, or `/connect-existing` after provider connected
- Exit:
  - Copy / Network / Share IconActions → CopySheet / ChainPickerSheet / ShareSheet ✓ (Phase 3)
  - Continue → `/onboarding/summary`
  - Back arrow → previous

### `/onboarding/summary` — Setup summary
- Entry: address
- Exit:
  - Continue to Home → `/(tabs)/home` (replace)

## Tabs (bottom nav)

### `/(tabs)/home` — Home
- Entry: tab nav, `/onboarding/summary` continue
- Exit:
  - Account hero card → `/(tabs)/accounts`
  - Security hero card → `/(tabs)/security`
  - Send icon action → `/send`
  - Receive icon action → `/receive`
  - Bridge icon action → `/bridge`
  - Secure icon action → `/(tabs)/security`
  - State cycle button (debug)

### `/(tabs)/activity` — Activity
- Entry: tab nav, `/transaction-review` confirm
- Exit:
  - Filter chips (All / Transactions / Security) — internal state, no nav
  - Tap a row → `/activity-detail` ✓ (Phase 3)
  - State cycle button (debug)

### `/(tabs)/accounts` — Accounts
- Entry: tab nav, Home account hero card
- Exit:
  - Primary HeroCard tap → `/account-detail` ✓ (Phase 3)
  - Other account Card tap → `/account-detail` ✓ (Phase 3)
  - "+" trailing button — TODO Phase 4+ (add-account flow with sub-account intent)
  - State cycle button (debug)

### `/(tabs)/apps` — Apps
- Entry: tab nav, Home Secure (via Security), Security row
- Exit:
  - Search input — local query, no nav
  - Per-app Edit → `/dapp-connection` (Phase 2 fix)
  - Per-app Revoke → `/transaction-review` (Phase 2 fix — revoke is a transaction)
  - Preview connection request → `/dapp-connection`
  - Preview signing request → `/message-signing-review` ✓ (Phase 3)
  - State cycle button (debug)

### `/(tabs)/security` — Security Center
- Entry: tab nav, Home Security hero card / Secure quick action
- Exit:
  - Open Readiness Report → `/readiness-report`
  - Validation Mode row → `/developer-mode` (Phase 2 fix — was deadend)
  - Recovery row → `/recovery`
  - Key Rotation row → `/recovery`
  - Connected Apps row → `/(tabs)/apps`
  - Approval Risk row → `/(tabs)/apps` (Phase 2 fix — was deadend)
  - Bridge Readiness row → `/bridge`
  - Developer Mode row → `/developer-mode`
  - State cycle button (debug)

## Action screens

### `/send` — Send
- Entry: Home Send quick action
- Exit:
  - Continue to Review → `/transaction-review`
  - Back arrow → previous
  - State cycle button (debug)

### `/transaction-review` — Transaction Review
- Entry: `/send`, `/bridge`, `/dapp-connection` (revoke / sign tx flows), `/recovery` (rotation as transaction)
- Exit:
  - Reject → `router.back()`
  - Confirm → `/(tabs)/activity` (replace)
  - Advanced details toggle — internal expansion
  - State cycle button (debug)

### `/receive` — Receive
- Entry: Home Receive quick action
- Exit:
  - Copy IconAction → opens `CopySheet` ✓ (Phase 3)
  - Network IconAction → opens `ChainPickerSheet` ✓ (Phase 3)
  - Share IconAction → opens `ShareSheet` (system share via `Share.share`) ✓ (Phase 3)
  - Back arrow → previous
  - State cycle button (debug)

### `/readiness-report` — Quantum Readiness Report
- Entry: Security "Open Readiness Report"
- Exit:
  - Tighten QubiSwap permissions row → `/(tabs)/apps` (Phase 2 fix — was deadend)
  - Test recovery row → `/recovery` (Phase 2 fix — was deadend)
  - Export report → system share sheet with JSON payload ✓ (Phase 4A)
  - Back arrow → previous

### `/dapp-connection` — Dapp connection request
- Entry: Apps tab "Preview connection request" (also reachable from Apps row Edit), in real wallet from injected provider
- Exit:
  - Reject → `router.back()`
  - Limited → `/(tabs)/apps` (Phase 2 fix — was back)
  - Connect → `/(tabs)/apps` (Phase 2 fix — was back)
  - State cycle button (debug)

### `/bridge` — Bridge
- Entry: Home Bridge quick action, Security Bridge Readiness row
- Exit:
  - Review route → `/transaction-review`
  - Back arrow → previous
  - State cycle button (debug)

### `/recovery` — Recovery & Rotation
- Entry: Security Recovery row, Security Key Rotation row, `/readiness-report` Test recovery row
- Exit:
  - Guardians SettingsRow → `/guardians` ✓ (Phase 3)
  - Test recovery → `/transaction-review` (Phase 2 fix — rotation tests are transactions)
  - Rotate keys → `/transaction-review` (Phase 2 fix)
  - Emergency rotate → `/transaction-review` (Phase 2 fix)
  - Back arrow → previous
  - State cycle button (debug)

### `/developer-mode` — Developer Mode
- Entry: Security Developer Mode row, Security Validation Mode row
- Exit:
  - Expandable section toggles — internal
  - Export debug JSON → system share sheet with JSON payload ✓ (Phase 4A)
  - Back arrow → previous
  - State cycle button (debug)

### `/message-signing-review` — Message Signing Review
- Entry: in real wallet from injected provider; in prototype via Apps tab "Preview signing request" ✓ (Phase 3)
- Exit:
  - Reject → `router.back()`
  - Sign → `router.back()`
  - Raw payload toggle — internal
  - State cycle button (debug)

### `/connect-existing` — Connect existing wallet
- Entry: Welcome "Connect Existing Wallet"
- Exit:
  - Provider row presses → `/onboarding/address` (replace) — simulated connect for prototype ✓ (Phase 3); real provider wiring deferred to Phase 4+
  - Migration scan toggle — local state
  - Continue → `/onboarding/address` (replace)
  - Back arrow → previous
  - State cycle button (debug)

## Phase 3 new screens

### `/activity-detail` — Activity detail
- Entry: any Activity row tap (Phase 3)
- Exit:
  - View on explorer → external explorer link ✓ (Phase 4A)
  - Back arrow → previous
  - State cycle button (debug)

### `/account-detail` — Account detail
- Entry: Accounts primary HeroCard tap, Accounts secondary Card tap (Phase 3)
- Exit:
  - Balance row → `/(tabs)/home`
  - Activity row → `/(tabs)/activity`
  - Connected apps row → `/(tabs)/apps`
  - Security mode row → `/(tabs)/security`
  - Set as primary → `/(tabs)/accounts` (replace, simulated)
  - Hide account → `/(tabs)/accounts` (replace, simulated)
  - Back arrow → previous
  - State cycle button (debug)

### `/guardians` — Guardians management
- Entry: Recovery Guardians SettingsRow (Phase 3)
- Exit:
  - Per-guardian row → `/transaction-review` (edit guardian = transaction)
  - Add guardian → `/transaction-review`
  - Remove → `/transaction-review`
  - Back arrow → previous
  - State cycle button (debug)

## Sheets (Phase 3)

Bottom sheets are not standalone routes; they overlay the calling screen via the [Sheet](apps/mobile/components/Sheet.tsx) primitive.

- `ChainPickerSheet` — opened from Receive / onboarding/address Network IconAction.
- `ShareSheet` — opened from Receive / onboarding/address Share IconAction (`Share.share` for system targets).
- `CopySheet` — opened from Receive / onboarding/address Copy IconAction; auto-dismiss after 1.2s.

## Phase 2 deadend fixes summary (shipped)

All wired during the polish pass:

- `/(tabs)/security` Validation Mode row: `() => {}` → `/developer-mode` ✓
- `/(tabs)/security` Approval Risk row: `() => {}` → `/(tabs)/apps` ✓
- `/readiness-report` Tighten QubiSwap row: `() => {}` → `/(tabs)/apps` ✓
- `/readiness-report` Test recovery row: `() => {}` → `/recovery` ✓
- `/dapp-connection` Limited / Connect: `router.back()` → `/(tabs)/apps` ✓
- `/(tabs)/apps` per-app Edit: → `/dapp-connection` ✓
- `/(tabs)/apps` per-app Revoke: → `/transaction-review` ✓
- `/recovery` Test recovery / Rotate keys / Emergency rotate SettingsRows: → `/transaction-review` ✓

Previously deferred `onPress={() => {}}` markers (shipped in Phase 3):

- ~~`/recovery` Guardians SettingsRow~~ — wired to `/guardians` ✓ Phase 3
- ~~`/connect-existing` provider rows~~ — wired to `/onboarding/address` (simulated) ✓ Phase 3

## Phase 3 wiring summary (shipped)

- `/(tabs)/activity` row tap → `/activity-detail` ✓
- `/(tabs)/accounts` HeroCard / Card tap → `/account-detail` ✓
- `/recovery` Guardians SettingsRow → `/guardians` ✓
- `/receive` and `/onboarding/address` Copy/Network/Share IconActions → sheets ✓
- `/(tabs)/apps` "Preview signing request" → `/message-signing-review` ✓
- `/connect-existing` provider rows → `/onboarding/address` (simulated) ✓
- `/account-detail` "Set as primary" / "Hide account" → `/(tabs)/accounts` (simulated) ✓
- `/guardians` per-guardian / Add / Remove → `/transaction-review` ✓
- All 18 debug `State: …` cycle buttons gated behind `EXPO_PUBLIC_QUBITOR_DEBUG=1` via `<DebugOnly>` ✓

`grep -rE "onPress=\{\(\) => \{\}\}" apps/mobile/app/` returns **zero hits** in Phase 3.

## Phase 4+ deferred work

- Accounts "+" trailing button → add-account flow with sub-account intent.
- Connect Existing provider rows → real mobile provider connection.
- Replace mock activity, token pricing, and historical indexing with explorer/indexer-backed data.
- Extend the current QubitorPQTxV1 signing path into full production policy, recovery, dapp permission, and bridge flows.
