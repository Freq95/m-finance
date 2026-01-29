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

  // Accents
  accentPositive: "#10B981", // Green-500
  accentNegative: "#EF4444", // Red-500
  accentPrimary: "#3B82F6", // Blue-500
  accentPrimaryHover: "#2563EB", // Blue-600
  accentPrimaryActive: "#1D4ED8", // Blue-700

  // Borders & Dividers
  border: "#E5E7EB", // Gray-200
  divider: "#E5E7EB", // Gray-200

  // Status Colors
  saved: "#10B981", // Green
  savedBg: "#D1FAE5", // Green-100
  savedText: "#065F46", // Green-800
  draft: "#F59E0B", // Amber
  draftBg: "#FEF3C7", // Amber-100
  draftText: "#92400E", // Amber-800
  pending: "#6B7280", // Gray

  // Shadows
  shadow: "rgba(0, 0, 0, 0.05)",
  shadowHover: "rgba(0, 0, 0, 0.1)",
} as const;

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
