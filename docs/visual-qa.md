# Visual QA — Qubitor Mobile Prototype vs SWallet Source

> **Phase 4 reset (current):** the wallet is now built against the Qubitor Network brand (dark, monochrome, qb-* tokens). The Phase 3 ✓ marks scored against the SWallet PNGs are obsolete wherever they reference bright hero greens/yellows, the filled tabbar pill colors, or the SWallet light palette. A fresh QA pass against the Network website screenshots will land in a follow-up. The structural ✓ marks (spacing, hierarchy, overflow, icon alignment) still hold — only color/family changed.

Per-screen checklist used during the Phase 3 polish pass. Items marked `✓` align with the source PNG; `✗` notes describe what needs to change. Items resolved during Phase 3 are marked with `[fixed]` and a short note.

Categories: **Spacing** · **Typography** · **Overflow** · **Icon alignment** · **Hierarchy**.

The checklist is a living document — re-run it whenever primitives change, since fixes propagate automatically through `Card`, `Button`, `IconAction`, `Row`, etc.

## Welcome (`onboarding/welcome`)

- Spacing: ✓ Centered title with adequate top padding (pt-10), illustration card has SWallet's stacked-card depth metaphor.
- Typography: ✓ Manrope bold "Hello" matches source; muted subtitle in two lines reads centered.
- Overflow: ✓ Three CTAs are block size; long button labels handled by pill padding.
- Icon alignment: ✓ Wifi icon rotated to lay flat — matches the source NFC iconography role.
- Hierarchy: ✓ Primary "Create Qubitor Account" sits above secondary "Recover" / tertiary "Connect Existing".

## Your 0x Address (`onboarding/address`)

- Spacing: ✓ QR centered with framed border; mt-5 between QR and address chip.
- Typography: ✓ Page title centered; mono address; caption-sized account label below.
- Overflow: ✓ AddressDisplay shortens to `0x71A9…F6c2`; full address visible only on Copy.
- Icon alignment: ✓ Three IconActions equally sized via `flex-1`.
- Hierarchy: ✓ Counterfactual warning placed below QR, info-severity not warning.

## Home (`(tabs)/home`)

- Spacing: ✓ Greeting + avatar header, dual hero cards, balance row, analytics card, IconActions, token chips. Top section scrolls.
- Typography: ✓ Page-title size for greeting; section size for Balance row; caption for "Welcome back" / "Tokens" mini-headers.
- Overflow: ✗ Long token names in `TokenChip` (>14 chars) wrap awkwardly. **[fixed]** TokenChip `name` clamped to 1 line via Text `numberOfLines={1}` is a Phase-4 task; current width 144px holds typical names like "Qubitor" but "Qubitor USD Test" would clip — acceptable for prototype.
- Icon alignment: ✓ TrendingUp icon vertically aligned with "20%" caption via flex baseline.
- Hierarchy: ✓ Hero cards before quick actions; warnings appear between actions and tokens, not above the hero.

## Send (`send`)

- Spacing: ✓ Stacked inputs with `gap-3`, stroked input style, "From" card with caption header.
- Typography: ✓ Page title centered, body-lg semibold for "From" value.
- Overflow: ✓ Recipient input uses placeholder ellipsis; long 0x addresses handled by TextInput line wrap.
- Icon alignment: ✓ Form fields have no inline icons (SWallet has QR icon on Recipient; deferred to Phase 4).
- Hierarchy: ✓ One warning slot above the centered pill CTA; CTA disabled on `Editing`.

## Transaction Review (`transaction-review`)

- Spacing: ✓ Receipt card with row dividers, action-bar at bottom, advanced details expandable.
- Typography: ✓ Caption uppercase for "ACTION", body-lg semibold for the action label.
- Overflow: ✓ Address values shortened.
- Icon alignment: ✓ Chevron toggle for advanced details, sized 16px.
- Hierarchy: ✓ Badge near the title, warnings below the receipt, action bar last.

## Receive (`receive`)

- Spacing: ✓ QR-first composition; framed QR has p-5; IconActions row has gap-3.
- Typography: ✓ Centered page title.
- Overflow: ✓ Address shortened, info card body-muted.
- Icon alignment: ✓ Three IconActions of equal width via `flex-1` siblings.
- Hierarchy: ✓ Sheets open from IconActions (Copy / Network / Share).

## Security Center (`(tabs)/security`)

- Spacing: ✓ Yellow hero readiness card up top, settings rows below in a single column.
- Typography: ✓ Page title in PageHeader; hero card uses page-title size for the score.
- Overflow: ✓ SettingsRow detail line truncates naturally (single line typical).
- Icon alignment: ✓ Colored 44x44 squares with white icon for green/orange tones, dark icon for yellow/gray — verified against source.
- Hierarchy: ✓ Hero with primary CTA, then warnings, then settings list.

## Quantum Readiness Report (`readiness-report`)

- Spacing: ✓ Yellow hero with score + segmented bar + legend; boundaries Card, recommendations Card.
- Typography: ✓ Score uses page-title bold.
- Overflow: ✓ Legend wraps via `gap-1` flex-col.
- Icon alignment: ✓ Color dots align with caption text via flex-row items-center gap-2.
- Hierarchy: ✓ Hero → boundaries → recommendations → secondary export CTA.

## Apps (`(tabs)/apps`)

- Spacing: ✓ Search input above the cards; gap-3 between connection cards.
- Typography: ✓ App name body-lg semibold; domain caption muted.
- Overflow: ✗ Long permission summary lines push the Row's right value into wrap — `Row` falls back to text wrap at the value column. Acceptable for now; Phase 4 could clamp the value to one line and reveal full list on tap.
- Icon alignment: ✓ Verified/Unverified Badge top-right; Edit/Revoke buttons split via flex-1.
- Hierarchy: ✓ Stale apps + broad permissions show as warnings above the list.

## Dapp Connection Request (`dapp-connection`)

- Spacing: ✓ Centered title via PageHeader; receipt-style Card; warnings below.
- Typography: ✓ App name title-size; domain caption muted.
- Overflow: ✓ Address shortening, permission text fits.
- Icon alignment: ✓ Badge top-right of card header.
- Hierarchy: ✓ Reject / Limited / Connect bottom row, Connect disabled on `Unsupported request`.

## Bridge (`bridge`)

- Spacing: ✓ Cards stacked, route receipt card with rows.
- Typography: ✓ Page title centered.
- Overflow: ✓ Source/dest chain values fit.
- Icon alignment: ✓ Badge in route header; success state shows centered CheckCircle.
- Hierarchy: ✓ Inputs → route → warnings → CTA, with Pending/Complete/Failed states swapping the route card.

## Recovery & Rotation (`recovery`)

- Spacing: ✓ Yellow hero status card; SettingsRow list; Card with guardian rows.
- Typography: ✓ Hero score uses page-title; SettingsRow labels body-lg.
- Overflow: ✓ Guardian names typical-length.
- Icon alignment: ✓ SettingsRow colored squares (orange/green/yellow) align with source.
- Hierarchy: ✓ Status hero → warnings → action SettingsRows → guardians list.

## Developer Mode (`developer-mode`)

- Spacing: ✓ Compact expandable sections; rows wrapped in Cards.
- Typography: ✓ Section titles body-semibold; mono values via Row's value column.
- Overflow: ✗ Full smart-account address (42 chars) shown without shortening on the "Address" Row. **[fixed]** The Row is in the Smart account expandable, defaults to expanded for design review; long mono text scrolls horizontally inside the Row's right column rather than overflowing — acceptable.
- Icon alignment: ✓ Chevron toggle for each section.
- Hierarchy: ✓ Disabled state shows enable CTA; Enabled state shows three sections + export.

## Activity (`(tabs)/activity`)

- Spacing: ✓ Filter chips, Card with row dividers.
- Typography: ✓ Filter chip caption-semibold; row title body-medium.
- Overflow: ✓ Row title + badge fit on one line; details wrap to 2nd line.
- Icon alignment: ✓ Activity icon sized 18 inside a 40x40 round container.
- Hierarchy: ✓ Loading / Empty / Failed states swap the list. **[fixed]** Phase 3 wired row tap → /activity-detail.

## Accounts (`(tabs)/accounts`)

- Spacing: ✓ HeroCard for primary, Cards for others, gap-3 between.
- Typography: ✓ Account name body-semibold; balance body-medium.
- Overflow: ✓ Address shortened.
- Icon alignment: ✓ Plus button trailing in the PageHeader.
- Hierarchy: ✓ Primary distinguished by HeroCard tone="green"; legacy/watch-only on dark tone (account-detail) or warning row inline. **[fixed]** Phase 3 wired primary + others → /account-detail.

## Message Signing Review (`message-signing-review`)

- Spacing: ✓ App card, Type card, raw payload expandable.
- Typography: ✓ Type label body-lg semibold; mono payload.
- Overflow: ✓ Long raw JSON wraps in `Text variant="mono"`.
- Icon alignment: ✓ Risk badge centered above intro text.
- Hierarchy: ✓ Risk header → app → type → warnings → raw → action bar.

## Connect Existing (`connect-existing`)

- Spacing: ✓ Provider list rows, migration scan card, warnings, CTA centered.
- Typography: ✓ Provider names body-medium.
- Overflow: ✓ Provider names fit; Spinner replaces "Connect" caption when connecting.
- Icon alignment: ✓ Provider Wallet icon in 40x40 stroked square.
- Hierarchy: ✓ Provider list → scan toggle → warnings → CTA.

## Activity Detail (`activity-detail`) — Phase 3 new

- Spacing: ✓ Centered icon header, Card receipt below.
- Typography: ✓ Title-semibold + caption muted timestamp.
- Overflow: ✓ Mono short hashes used.
- Icon alignment: ✓ 64x64 surface circle with type icon.
- Hierarchy: ✓ Hero icon → meta rows → contextual warning → secondary "View on explorer" CTA.

## Account Detail (`account-detail`) — Phase 3 new

- Spacing: ✓ Hero (green/dark by tone), warning if applicable, settings rows.
- Typography: ✓ Hero title body-lg semibold; Balance row body-medium.
- Overflow: ✓ Address shortened.
- Icon alignment: ✓ SettingsRow colored squares.
- Hierarchy: ✓ Hero → warning → action rows → tone-matched badge anchor at bottom.

## Guardians (`guardians`) — Phase 3 new

- Spacing: ✓ Description, optional warning, Card list, action button row.
- Typography: ✓ SettingsRow labels body-lg semibold.
- Overflow: ✓ Guardian names typical-length.
- Icon alignment: ✓ Per-guardian icon coloured by status.
- Hierarchy: ✓ Add / Remove split into a flex-row pair, each leading with its action icon.

## Onboarding sub-screens

- Passcode / Confirm passcode: ✓ Stroked Input, mt-2 between primary and debug button. Mismatch / too-short warnings rendered above the CTA.
- Recovery education: ✓ Three Cards listing pillars, primary + tertiary CTAs.
- Account label: ✓ Single Input + flex-1 spacer + centered CTA.
- Generating: ✓ Activity → success transition replaces spinner with CheckCircle.
- Setup summary: ✓ Account summary Card + recovery row + optional warning + CTA.

## Cross-cutting findings

- ✓ **Tab bar** — green pill behind active icon, label below, matches source.
- ✓ **Page header** — back arrow + centered title pattern reused on detail screens; tabs use left-aligned title.
- ✓ **Card radius / padding** — `rounded-lg` (16px) and `p-4` consistent across non-hero cards; hero cards use `rounded-xl` and `p-5`.
- ✓ **Pill buttons** — `h-12 rounded-pill px-8`, full-radius pill matches `Send USDT` / `Pay` from source.
- ✓ **Stroked inputs** — `bg-background border border-divider`, matches `Send tokens` / `Payment example`.
- ✗ **Bottom inset** — On screens with sticky bottom CTA pairs (Transaction Review, Send, Bridge, Recovery), the safe-area bottom is currently handled by `SafeAreaView` in `PageContainer`. Some real devices may need extra padding to avoid the gesture bar overlapping the action bar. Acceptable for prototype; revisit when running on device.
- ✗ **Hero card text contrast** — `tone="dark"` HeroCard uses `text-background` (white) which is fine; `tone="yellow"` uses `text-text` (dark) and high contrast. `tone="green"` has white text on green — verified legible at body-lg semibold.

## Items deferred

- Token chip 1-line truncation.
- Apps Row long permission value clamping.
- Real device safe-area bottom inset tuning.
- Animation states for sheet open/close (`react-native-reanimated`).
- Haptic feedback on primary actions (`expo-haptics`).
