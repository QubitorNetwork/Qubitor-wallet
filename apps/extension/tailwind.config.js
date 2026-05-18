const { colors, spacing, radius } = require("@qubitor/ui-tokens");

module.exports = {
  content: [
    "./popup.tsx",
    "./options.tsx",
    "./components/**/*.{ts,tsx}",
    "./contents/**/*.{ts,tsx}",
    "./options/**/*.{ts,tsx}",
    "./screens/**/*.{ts,tsx}",
    "./tabs/**/*.{ts,tsx}",
  ],
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

        // Legacy aliases for backward compat with screens already shipped.
        background: colors.background,
        surface: colors.panel,
        primary: colors.text,
        text: colors.text,
        "text-muted": colors.textMuted,
        divider: colors.line,
      },
      spacing: {
        page: `${spacing.pageMarginX}px`,
      },
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
        pill: `${radius.pill}px`,
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
};
