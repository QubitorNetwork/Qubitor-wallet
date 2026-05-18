# Qubitor Visual Specs — Implementation Handoff

> **Phase 4 (current):** the wallet apps align with the Qubitor Network website brand (`apps/web/app/globals.css` `@theme` block in the Qubitor Network repo). Dark, monochrome, hairline-driven. The Phases 1–3 SWallet-derived palette is superseded — see § 1 for the current tokens.

Single consolidated reference for the native engineering and design QA teams. Mirrors the values that live in code (`packages/ui-tokens/src/index.ts`, `apps/mobile/components/`, `apps/extension/components/`) with rationale and intended usage.

Cross-references:

- Source visual language → `docs/swallet-ui-adaptation.md`
- Per-screen states → `docs/screen-requirements.md`
- Canonical strings → `docs/copy-library.md`
- Navigation graph → `docs/navigation-map.md`
- Ad-hoc QA findings → `docs/visual-qa.md`

## 1. Tokens reference

Code: [packages/ui-tokens/src/index.ts](packages/ui-tokens/src/index.ts).

### Colors (Qubitor Network qb-* palette)

| Role | Hex / value | Usage |
| --- | --- | --- |
| `background` (qb-black) | `#050505` | Root app background, popup surface |
| `ink` (qb-ink) | `#0b0b0b` | Nested surfaces, inputs, sheets, pressed states |
| `panel` (qb-panel) | `#0f0f0f` | Cards, hero containers, IconAction squares |
| `text` (qb-bone) | `#ededed` | Primary text, primary CTA fill |
| `textMuted` (qb-mist) | `#8a8a8a` | Captions, sub-labels, inactive icons |
| `line` (qb-line) | `rgba(255,255,255,0.08)` | Default 1px hairline / row divider |
| `lineStrong` (qb-line-strong) | `rgba(255,255,255,0.18)` | Emphasized hairline, button outline, sheet handle |
| `spark` (qb-spark) | `#ffffff` | Focus ring, selection background, review badge outline |
| `warn` | `#E07A4A` | 1–2px alert hairline (review / warning severity) |
| `crit` | `#F25C5C` | 1–2px alert hairline (critical severity) |

The website itself has no semantic alert colors. `warn` / `crit` are wallet-only and used **only as 1–2px borders or left-bar accents**, never as filled surfaces. Hero/Settings-icon/badge filled palettes from Phases 1–3 are deprecated; all surfaces are now `panel` or `ink` with hairlines.

Rationale: mirrors the Qubitor Network website `apps/web/app/globals.css` `@theme` block so the wallet reads as one product with the Network website.

### Spacing

| Token | px | Usage |
| --- | --- | --- |
| `xs` | 4 | Inline gaps between icon and label inside chips |
| `sm` | 8 | Tight gaps in flex rows |
| `md` | 12 | Default gap between siblings in a Card |
| `lg` | 16 | Page horizontal margin (`pageMarginX`), default Card padding |
| `xl` | 24 | Section spacing on long-scroll screens |
| `xxl` | 32 | Hero block bottom-padding |
| `pageMarginX` | 16 | Locked page horizontal margin |
| `rowMinHeight` | 48 | Settings/list row minimum height |
| `rowComfortableHeight` | 56 | Settings rows with sub-labels |
| `iconActionSize` | 56 | IconAction square side |
| `settingsIconSize` | 44 | SettingsRow colored icon side |
| `buttonHeight` | 48 | Pill button height |

Rationale: extracted by measuring SWallet PNGs at the documented 412x892 frame.

### Radius

| Token | px | Usage |
| --- | --- | --- |
| `sm` | 8 | Inline tags, small accents |
| `md` | 12 | Inputs, tertiary buttons (rare) |
| `lg` | 16 | Default Card |
| `xl` | 20 | Hero card |
| `pill` | 999 | Pill buttons, badges, active tab pill |
| `qrFrame` | 24 | QR rounded-rectangle border |
| `heroCard` | 20 | Hero card border-radius |

### Typography

Three families from the Qubitor Network @theme block:

- **Display** — Space Grotesk (qb-display). Used on page titles, hero scores, section type. Tight tracking (-0.5px on 32px), line-height 0.95 for the most condensed display moments.
- **Body** — Inter (qb-body). Default. Line-height ≈1.6.
- **Mono** — JetBrains Mono (qb-label / qb-mono). Uppercase, 0.22em (≈2.4px) tracking on 11px — used for "labels" / "eyebrows" / nav indices like `01 / Account`, `02 / Receive`, `05 / Security`.

| Role | Size | Family | Usage |
| --- | --- | --- | --- |
| `caption` / `label` | 11 | Inter / Mono | Caption (Inter) or eyebrow (Mono uppercase) |
| `body` | 14 | Inter | Default body |
| `bodyLarge` | 16 | Inter | Form values, button labels, list row labels |
| `title` | 20 | Space Grotesk Medium | Section titles |
| `section` | 24 | Space Grotesk Medium | Balance row on Home |
| `pageTitle` | 32 | Space Grotesk Medium | Top-of-screen title |
| `mono` | 14 | JetBrains Mono | Addresses, hashes, raw payloads |

Line heights: `body=22`, `title=28`, `pageTitle=36` (display-tight per website).

### Elevation

`elevation.card` — soft shadow under any non-flat surface that needs separation from the white background. Applied sparingly; SWallet uses elevation only on hero cards. Default Card stays flat.

### Tab bar

| Token | Value |
| --- | --- |
| `tabBar.height` | 72 |
| `tabBar.pillWidth` | 96 |
| `tabBar.pillHeight` | 32 |
| `tabBar.pillRadius` | 999 |
| `tabBar.iconSize` | 22 |
| `tabBar.labelSize` | 11 |
| `tabBar.activeBackground` | primary green |
| `tabBar.activeIconColor` | white |
| `tabBar.activeLabelColor` | primary green |
| `tabBar.inactiveIconColor` | textMuted |
| `tabBar.inactiveLabelColor` | textMuted |

Rationale: Main / DApps / Setting PNGs all show this exact pattern.

### Card / Input / Button defaults

`card.padding=16 / radius=lg / background=surface` (hero variant uses `radius=heroCard padding=20`). `input.height=56 / radius=md / background=background / border=1px divider / paddingX=16`. `button.height=48 / radius=pill / paddingX=32 / primary=primary green / textWeight=semibold`.

## 2. Components

Mobile components live in `apps/mobile/components/`. Extension components in `apps/extension/components/`. Both consume `@qubitor/ui-tokens`.

| Component | Source PNG | Dimensions | Notes |
| --- | --- | --- | --- |
| [PageContainer](apps/mobile/components/PageContainer.tsx) | n/a | full screen | SafeAreaView + horizontal page margin; scroll variant default |
| [PageHeader](apps/mobile/components/PageHeader.tsx) | Setting.png / Send tokens.png | min-row-comfy | Optional back arrow, centered or left title, optional trailing accessory |
| [Card](apps/mobile/components/Card.tsx) | Main / Setting / Payment | radius=lg, p=16 | Hero variant: radius=xl, p=20 |
| [HeroCard](apps/mobile/components/HeroCard.tsx) | Main / Wallet analytics | flex-1 min-h-[140] | Three tones: green / yellow / dark |
| [Badge](apps/mobile/components/Badge.tsx) | All-Tokens pill on Wallet analytics | px-3 py-1 rounded-pill | Color resolved via `badgeColorByState` map |
| [Button](apps/mobile/components/Button.tsx) | Send tokens.png / Payment example.png | h-12 rounded-pill px-8 | size=default inherits parent layout; size=block forces w-full |
| [Row](apps/mobile/components/Row.tsx) | Payment example receipt rows | py-3 with bottom divider | Optional chevron when onPress present |
| [SettingsRow](apps/mobile/components/SettingsRow.tsx) | Setting.png | py-3, 44x44 colored icon | Four icon tones; chevron always present |
| [IconAction](apps/mobile/components/IconAction.tsx) | Receive.png | 56x56 surface square + caption | Used in groups of 3–4 in flex-row |
| [Input](apps/mobile/components/Input.tsx) | Send tokens.png | h-14 stroked, optional caption label | Single-line; multi-line variant reserved for Phase 4 |
| [WarningCard](apps/mobile/components/WarningCard.tsx) | implicit | rounded-lg p-4 | Severity drives tone: info / review / warning / critical |
| [SegmentedBar](apps/mobile/components/SegmentedBar.tsx) | Main analytics card | h-3 rounded-pill | Multi-segment proportional, used on Home and Readiness Report |
| [TokenChip](apps/mobile/components/TokenChip.tsx) | Main tokens row | w-36 surface card | Logo round + balance + name + fiat |
| [QrFrame](apps/mobile/components/QrFrame.tsx) | Receive.png | p-5 border-2 | Standalone framed QR |
| [AddressDisplay](apps/mobile/components/AddressDisplay.tsx) | implicit | mono | `0x71A9…F6c2` shortening by default |
| [Sheet](apps/mobile/components/Sheet.tsx) | implicit (RN modal pattern) | bottom-anchored | Drag handle + rounded top |
| [DebugOnly](apps/mobile/components/DebugOnly.tsx) | n/a | passthrough | Renders children only when `EXPO_PUBLIC_QUBITOR_DEBUG=1` |

States exposed by `useMockState`: every screen with multiple brief-listed States cycles them via a tertiary debug button (visible only with the env flag set).

## 3. Per-screen layout

Hero treatments per screen, captured concisely:

- **Welcome** — centered "Hello", green/dark layered hero card, three stacked block CTAs.
- **Onboarding sub-screens** — left PageHeader with back arrow, single primary input + centered pill CTA, optional warning above the CTA.
- **Your 0x Address / Receive** — centered PageHeader, framed QR, IconActions row, info Card, sheets for Network / Share / Copy.
- **Home** — greeting + avatar header, dual `HeroCard` row, Balance row in section type, analytics Card with SegmentedBar, IconActions row, conditional warnings, horizontal-scroll TokenChips.
- **Activity** — left PageHeader, filter chip row, Card-of-rows or Card-empty, every row tappable to detail.
- **Activity detail** — centered PageHeader, hero icon circle + title + timestamp + badge, receipt Card with row metadata, contextual warning, "View on explorer" secondary CTA.
- **Accounts** — left PageHeader with trailing "+" button, primary HeroCard tone="green", secondary Cards for legacy/watch-only, all tappable to /account-detail.
- **Account detail** — centered PageHeader, tone-matched HeroCard, conditional warning, SettingsRow list (Balance / Activity / Connected apps / Security mode / Set as primary / Hide), centered status Badge.
- **Apps** — left PageHeader, search Input, optional warning, list of connection Cards each with Edit + Revoke split-flex action bar, two debug "Preview …" entry buttons at bottom.
- **Dapp Connection** — centered PageHeader, intro paragraph, Card receipt, conditional warnings, three-button bottom action bar (Reject / Limited / Connect).
- **Send** — centered PageHeader, "From" Card caption, four stacked stroked inputs, conditional warning, centered pill CTA disabled until "Ready for review".
- **Transaction Review** — centered PageHeader + centered Badge, intro paragraph, receipt Card, conditional warnings, expandable "Advanced details" Card, two-button action bar.
- **Message Signing Review** — centered PageHeader + risk Badge, intro paragraph, app Card, type Card, conditional warnings, expandable raw payload Card, two-button action bar.
- **Bridge** — centered PageHeader, From/To Card, two stroked inputs, route Card or pending/complete/failed swap card, conditional warnings, centered CTA.
- **Recovery** — left PageHeader, intro paragraph, yellow hero status card, conditional warnings, four SettingsRows for recovery actions, optional guardians Card.
- **Guardians** — left PageHeader, description, conditional warning, Card-of-rows, action-row split (Add + Remove).
- **Readiness Report** — left PageHeader, yellow hero with score + segmented bar + legend, boundaries Card, recommended-actions Card, secondary export CTA.
- **Developer Mode** — left PageHeader with Off/On Badge, info warning, expandable sections (Smart account / Modules / UserOperation), secondary export CTA.
- **Connect Existing** — left PageHeader, description, provider list Card, migration scan Card, conditional warning, centered CTA disabled until "Provider connected".
- **Security Center** — left PageHeader, yellow hero readiness Card with primary CTA, conditional warnings, settings list of seven SettingsRows.

## 4. Mobile-specific rules

- **Touch target minimums**: 44x44 logical px (Apple HIG) / 48x48 dp (Material). Pill buttons at h=48; SettingsRow at min-h=48; IconAction square 56x56 — all comfortable.
- **Safe-area handling**: `PageContainer` uses `SafeAreaView` from `react-native-safe-area-context`. Bottom action bars on Send / Transaction Review / Bridge / Recovery currently rely on default ScrollView padding; revisit on real devices for gesture-bar overlap.
- **Scroll**: `PageContainer` defaults to a vertical ScrollView with `contentContainerClassName="px-page pb-12"`. Set `scrollable={false}` for full-bleed forms (passcode entries) where the keyboard is the focus.
- **Keyboard**: `Input` is `TextInput` with `placeholderTextColor` set to `textMuted`. Currently no `KeyboardAvoidingView` wrap — Phase 4 task before real device testing.
- **Haptics**: not yet wired. Recommend `expo-haptics` `impactAsync(Light)` on primary button press, `Light` on Sheet open/close, `Success` on Transaction Review confirm.
- **Animations**: not yet wired. Recommend `react-native-reanimated` for sheet slide-up, hero card press scale, list item enter.

## 5. Extension-specific rules

- **Popup width**: 360px. Defined inline in `popup.tsx`. Chrome's max popup width is 800px; staying narrow keeps the layout phone-like.
- **Tab modal width**: 420px (passed to `chrome.windows.create({ width: 420, height: 720 })` in `background.ts`). Matches mobile screen width target so the same layout primitives translate.
- **Options page**: `flex` layout with a 240px sticky sidebar + flexible main column up to `max-w-3xl`. Sidebar is the in-app router driven by `?page=...`.
- **Provider scope**: MAIN-world content script (`contents/inject-provider.ts`) installs `window.qubitor`; ISOLATED-world relay (`contents/relay.ts`) forwards consent-required calls to the background service worker (`background.ts`) which opens `tabs/request.html`.
- **Permissions**: `manifest.permissions = ["storage", "tabs"]`, `host_permissions = ["https://*/*", "http://*/*"]`. `chrome.windows.create` does not require an additional permission.

## 6. Native handoff checklist

Phase 4A shipped the first runtime handoff items:

- Mobile Readiness Report and Developer Mode export use the native system share sheet with JSON payloads.
- Mobile Activity Detail opens external explorer URLs for transaction events.
- Browser extension provider requests now round-trip through the MAIN-world provider, isolated relay, background service worker, review popup, and `chrome.storage`-backed connected-origin state.

Phase 4B shipped the first live EVM read layer:

- [@qubitor/evm](../packages/evm/src/index.ts) exposes env-configurable public-client helpers for supported chains.
- [useAccountSnapshot](../apps/mobile/hooks/useAccountSnapshot.ts) reads native QBT balance, deployment/code status, latest block, chain ID, and address from Qubitor RPC.
- Home, Accounts, Account Detail, Receive, Onboarding Address/Summary, Security, Readiness Report, and Developer Mode consume that snapshot with mock fallback.
- Runtime config lives in [apps/mobile/.env.example](../apps/mobile/.env.example) and [apps/mobile/.env.testnet.example](../apps/mobile/.env.testnet.example): `EXPO_PUBLIC_QUBITOR_CHAIN_ID`, `EXPO_PUBLIC_QUBITOR_RPC_URL`, `EXPO_PUBLIC_QUBITOR_FAUCET_URL`, `EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL`, and optional `EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS`.

These need attention when this prototype graduates to a shipped wallet:

- **Biometrics** for app unlock — `expo-local-authentication` or native equivalents.
- **Secure storage** for keys and recovery secrets — `expo-secure-store` / `react-native-keychain`. Never fall back to AsyncStorage for anything signing-related.
- **Push notifications** for recovery requests, dapp signature requests, security alerts — Expo Notifications + per-platform credentials.
- **Deep linking** — `qubitor://` scheme already in `app.json`; needs landing handlers per route.
- **Universal links / share extensions** for receiving WalletConnect URIs from other apps.
- **Real-device safe-area tuning** for the bottom action bars (gesture pill overlap on iOS).
- **Keyboard avoidance** on forms with stacked inputs.
- **Accessibility**: `accessibilityLabel` on every Pressable, `accessibilityRole`, dynamic-type scaling for typography tokens, color-blind-safe badge palette.
- **i18n / localization**: copy currently hardcoded English; Phase 4 should extract via `i18next` or similar with `copy-library.md` as the source of truth.
- **Animations + haptics** as listed in §4.
- **Dark mode** — Phase 1 deliberately mirrored SWallet's light-mode-only design. A dark theme means a second token palette and verifying every screen renders.
- **Real ERC-4337 / EIP-7702 wiring** — Phase 4B covers basic RPC reads only. Next: smart-account derivation, bundler, paymaster, UserOperation simulation, and signing flows.
- **Telemetry / crash reporting** — Sentry or similar; instrument the critical flows (account creation, transaction signing, recovery).
- **App Store / Play Store assets** — icons, splash, store listing copy.
