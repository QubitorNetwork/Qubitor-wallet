const { colors, spacing, radius, typography } = require("@qubitor/ui-tokens");

module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Qubitor Network brand palette (Phase 4).
        "qb-black": colors.background,
        "qb-ink": colors.ink,
        "qb-panel": colors.panel,
        "qb-bone": colors.text,
        "qb-mist": colors.textMuted,
        "qb-line": colors.line,
        "qb-line-strong": colors.lineStrong,
        "qb-spark": colors.spark,
        warn: colors.warn,
        crit: colors.crit,

        // Legacy aliases retained so the 12 non-hero screens still compile.
        background: colors.background,
        surface: colors.panel,
        "surface-strong": colors.ink,
        primary: colors.text,
        "primary-pressed": colors.primaryPressed,
        text: colors.text,
        "text-muted": colors.textMuted,
        divider: colors.line,
      },
      spacing: {
        page: `${spacing.pageMarginX}px`,
        "row-min": `${spacing.rowMinHeight}px`,
        "row-comfy": `${spacing.rowComfortableHeight}px`,
      },
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
        pill: `${radius.pill}px`,
      },
      fontFamily: {
        display: [typography.fontFamily.display],
        sans: [typography.fontFamily.body],
        mono: [typography.fontFamily.mono],
      },
      fontSize: {
        caption: `${typography.size.caption}px`,
        body: `${typography.size.body}px`,
        "body-lg": `${typography.size.bodyLarge}px`,
        title: `${typography.size.title}px`,
        section: `${typography.size.section}px`,
        "page-title": `${typography.size.pageTitle}px`,
      },
      letterSpacing: {
        label: `${typography.letterSpacing.label}px`,
        tight: `${typography.letterSpacing.tight}px`,
      },
    },
  },
  plugins: [],
};
