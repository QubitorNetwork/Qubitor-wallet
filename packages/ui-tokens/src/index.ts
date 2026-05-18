/**
 * @qubitor/ui-tokens
 *
 * Single source of truth for visual tokens consumed by:
 * - apps/mobile (NativeWind)
 * - apps/extension (Tailwind)
 *
 * Mirrors the Qubitor Network brand `@theme` block in
 * QubitorNetwork/apps/web/app/globals.css. Dark, monochrome, hairline-driven.
 *
 * Phase 4 supersedes the SWallet-derived palette of Phases 1–3:
 * - dropped `colors.badge.*`, `colors.settingsIcon.*`, `colors.hero.*`,
 *   `colors.warningSoft`, `colors.warningStrong`
 * - replaced with the qb-* palette + a minimal pair of alert hairlines
 *   (`warn`, `crit`) used as 2px accent bars on WarningCard only.
 *
 * Cross-reference: docs/visual-specs.md, QubitorNetwork/apps/web/app/globals.css.
 */

export const colors = {
  // Surfaces (dark, from website @theme).
  background: "#050505", // qb-black — root background
  ink: "#0b0b0b", // qb-ink — nested surfaces, inputs, sheets
  panel: "#0f0f0f", // qb-panel — cards, hero containers

  // Text.
  text: "#ededed", // qb-bone — primary text, primary CTA fill
  textMuted: "#8a8a8a", // qb-mist — muted text, inactive icons

  // Hairlines.
  line: "rgba(255,255,255,0.08)", // qb-line — default 1px divider
  lineStrong: "rgba(255,255,255,0.18)", // qb-line-strong — emphasized outline
  spark: "#ffffff", // qb-spark — focus ring, selection bg

  // Wallet-only alert hairlines (the website itself has no alerts).
  // Used as 1–2px accent borders / left bars, never as filled backgrounds.
  warn: "#E07A4A",
  crit: "#F25C5C",

  // Legacy aliases retained for backward compatibility with screens that still
  // reference the Phase 1–3 names. Resolved against the new palette.
  surface: "#0f0f0f", // → panel
  surfaceStrong: "#0b0b0b", // → ink
  primary: "#ededed", // → bone (primary CTA fill)
  primaryPressed: "#cfcfcf",
  divider: "rgba(255,255,255,0.08)", // → line

  // Legacy sub-objects retained so non-hero screens still compile. All
  // values resolve into the Phase 4 monochrome palette; the screens render
  // visually consistent with the new theme even though they reference old keys.
  badge: {
    positive: "#ededed", // → bone
    review: "#ffffff", // → spark
    warning: "#E07A4A", // → warn
    neutral: "rgba(255,255,255,0.18)", // → line-strong
  },
  hero: {
    green: "#0f0f0f", // → panel
    yellow: "#0f0f0f", // → panel
    dark: "#0f0f0f", // → panel
  },
  warningSoft: "#0f0f0f", // → panel
  warningStrong: "#E07A4A", // → warn
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,

  pageMarginX: 16,
  rowMinHeight: 48,
  rowComfortableHeight: 56,
  iconActionSize: 56,
  settingsIconSize: 44,
  buttonHeight: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
  qrFrame: 18,
  heroCard: 16,
} as const;

export const typography = {
  fontFamily: {
    // Resolved to Expo Google Fonts names in apps/mobile/app/_layout.tsx
    // and to CSS @import names in apps/extension/style.css.
    display: "SpaceGrotesk-Medium", // qb-display
    body: "Inter", // qb-body
    bodyMedium: "Inter-Medium",
    mono: "JetBrainsMono", // qb-label / qb-mono

    // Legacy aliases (Phase 1–3 names).
    primary: "Inter",
  },
  size: {
    caption: 11, // qb-label is 0.6875rem = 11px on the website
    body: 14,
    bodyLarge: 16,
    title: 20,
    section: 24,
    pageTitle: 32,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    body: 22, // 1.6 × 14 ≈ 22
    title: 28,
    pageTitle: 36, // 0.95 × ~38 (display tight)
  },
  letterSpacing: {
    tight: -0.5, // display, -0.02em on ~32px
    label: 2.4, // qb-label 0.22em on 11px
  },
} as const;

export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  // Cards stay flat — the website uses hairlines, not shadows.
  hairline: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
} as const;

export const layout = {
  mobileFrame: { width: 412, height: 892 },
} as const;

// Tab bar — bone-pill active treatment on black.
export const tabBar = {
  height: 72,
  pillWidth: 96,
  pillHeight: 32,
  pillRadius: 999,
  iconSize: 22,
  labelSize: 10,
  activeBackground: colors.text, // qb-bone fill
  activeIconColor: colors.background, // qb-black icon
  activeLabelColor: colors.text, // qb-bone label below pill
  inactiveIconColor: colors.textMuted, // qb-mist
  inactiveLabelColor: colors.textMuted,
  background: colors.background, // qb-black
  borderTopColor: colors.line, // qb-line
} as const;

export const card = {
  padding: 16,
  radius: radius.lg,
  background: colors.panel, // qb-panel
  borderColor: colors.line, // qb-line
  borderWidth: 1,
  hero: {
    radius: radius.heroCard,
    padding: 20,
    background: colors.panel,
    borderColor: colors.lineStrong,
    borderWidth: 1,
  },
} as const;

export const input = {
  height: 52,
  radius: radius.md,
  background: colors.ink, // qb-ink
  borderColor: colors.line, // qb-line
  borderWidth: 1,
  focusBorderColor: colors.lineStrong,
  paddingX: 16,
  textSize: typography.size.bodyLarge,
  placeholderColor: colors.textMuted,
} as const;

export const button = {
  height: 48,
  radius: radius.pill,
  paddingX: 32,
  // Primary = bone fill (the website's selection-bg treatment).
  primaryBackground: colors.text,
  primaryColor: colors.background,
  // Secondary = transparent + 1px line-strong outline.
  secondaryBackground: "transparent",
  secondaryColor: colors.text,
  secondaryBorderColor: colors.lineStrong,
  textSize: typography.size.bodyLarge,
  textWeight: typography.weight.medium,
} as const;

/**
 * Maps Qubitor security/state names to badge palette keys.
 * The badge component now resolves all keys to a small monochrome set
 * (positive | review | warning | neutral). Color is implemented by the
 * primitive itself; this map only categorizes.
 */
export type BadgeColor = "positive" | "review" | "warning" | "neutral";

export const badgeColorByState: Record<string, BadgeColor> = {
  "Smart Account Ready": "positive",
  "Hybrid Protected": "positive",
  "PQ Ready": "positive",
  "PQ Native": "positive",
  "Compatibility Mode": "neutral",
  "Legacy Route": "warning",
  Legacy: "warning",
  "External Dependency": "neutral",
  "Recovery Active": "positive",
  "Rotation Recommended": "review",
  "Recovery Missing": "warning",
  Verified: "positive",
  Unverified: "warning",
  Limited: "review",
};

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  elevation,
  layout,
  tabBar,
  card,
  input,
  button,
  badgeColorByState,
} as const;

export type Tokens = typeof tokens;
