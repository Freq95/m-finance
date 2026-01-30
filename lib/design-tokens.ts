/**
 * Design Tokens
 * Centralized design system tokens matching the design reference
 */

export const colors = {
  // Backgrounds
  background: "#F5F7FA", // Very light gray-blue
  card: "#FFFFFF", // Pure white
  sidebar: "#1F2937", // Dark gray-800

  // Text
  textPrimary: "#111827", // Gray-900
  textSecondary: "#6B7280", // Gray-500
  textMuted: "#9CA3AF", // Gray-400

  // Accents (palette: teal #215E61, dark blue #233D4D, orange #FE7F2D, light #F5FBE6)
  accentPositive: "#215E61", // Teal
  accentNegative: "#FE7F2D", // Orange
  accentPrimary: "#215E61", // Teal
  accentPrimaryHover: "#1a4a4d", // Darker teal
  accentPrimaryActive: "#233D4D", // Dark blue
  accentOrange: "#FE7F2D", // Chart/secondary accent

  // Borders & Dividers
  border: "#E5E7EB", // Gray-200
  divider: "#E5E7EB", // Gray-200

  // Status Colors (palette)
  saved: "#215E61", // Teal
  savedBg: "#F5FBE6", // Light yellow-green
  savedText: "#233D4D", // Dark blue
  draft: "#FE7F2D", // Orange
  draftBg: "#FFF4ED", // Light orange
  draftText: "#B45309", // Dark orange
  pending: "#6B7280", // Gray

  // Chart palette (for pie etc.): teal, dark blue, orange (+ greys unchanged elsewhere)
  chartPalette: ["#215E61", "#233D4D", "#FE7F2D", "#215E61", "#233D4D", "#FE7F2D"],

  // Shadows
  shadow: "rgba(0, 0, 0, 0.05)",
  shadowHover: "rgba(0, 0, 0, 0.1)",
} as const;

/** Recharts Tooltip: no default white box; use with chart-tooltip class or contentStyle. High z-index so tooltips render above cards. */
export const chartTooltipWrapperStyle: Record<string, string | number> = {
  outline: "none",
  border: "none",
  background: "transparent",
  boxShadow: "none",
  padding: 0,
  zIndex: 10000,
};

/** Bar corner radius for Recharts bars (stacked and single). [topLeft, topRight, bottomRight, bottomLeft]. */
export const barCornerRadius = 4;

/** Bar chart hover cursor — subtle highlight (replaces default grey block). In Bar charts use a Rectangle element with radius for rounded corners. */
export const chartBarCursorStyle: Record<string, string | number> = {
  fill: "rgba(255, 255, 255, 0.06)",
  stroke: "rgba(255, 255, 255, 0.14)",
  strokeWidth: 1,
};

/** Recharts default tooltip content (formatter-only) — dark glass */
export const chartTooltipContentStyle: Record<string, string | number> = {
  margin: 0,
  padding: "12px 16px",
  borderRadius: "16px",
  background: "rgba(30, 30, 34, 0.92)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
  color: "rgb(255, 255, 255)",
  fontSize: "13px",
  minWidth: "140px",
};

export const typography = {
  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",

  // Headings
  h1: {
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontSize: "24px",
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  },
  h3: {
    fontSize: "18px",
    fontWeight: 500,
    lineHeight: 1.4,
  },

  // Body
  body: {
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: 1.5,
  },

  // Labels & Small
  label: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.4,
  },
  small: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.4,
  },
  muted: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.4,
    color: colors.textMuted,
  },

  // Metric Values
  metricValue: {
    fontSize: "28px",
    fontWeight: 400,
    lineHeight: 1.2,
  },
} as const;

export const spacing = {
  xs: "4px", // Tight spacing, icons
  sm: "8px", // Small gaps
  md: "16px", // Card padding, section gaps
  lg: "24px", // Between major sections
  xl: "32px", // Page margins
  "2xl": "48px", // Large section separators

  // Specific Usage
  cardPadding: "24px", // p-6
  sectionGap: "24px", // gap-6
  inputSpacing: "16px", // mb-4
  buttonPadding: "12px 24px", // px-6 py-3
} as const;

export const shadows = {
  card: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
  cardHover: "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
  modal: "0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)",
  sidebar: "4px 0 24px rgba(0, 0, 0, 0.06)",
  glass: "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
} as const;

export const transitions = {
  default: "200ms cubic-bezier(0.33, 1, 0.68, 1)",
  page: "320ms cubic-bezier(0.33, 1, 0.68, 1)",
  modal: "320ms cubic-bezier(0.33, 1, 0.68, 1)",
  liquid: "320ms cubic-bezier(0.33, 1, 0.68, 1)",
} as const;
