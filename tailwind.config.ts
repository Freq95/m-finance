import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFC",
        "background-deep": "#F2F2F7",
        card: "#FFFFFF",
        sidebar: "#1F2937",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        textMuted: "#9CA3AF",
        accentPositive: "#215E61",
        accentNegative: "#FE7F2D",
        accentPrimary: "#215E61",
        accentPrimaryHover: "#1a4a4d",
        accentPrimaryActive: "#233D4D",
        accentOrange: "#FE7F2D",
        border: "#E5E7EB",
        divider: "#E5E7EB",
        saved: "#215E61",
        savedBg: "#F5FBE6",
        savedText: "#233D4D",
        draft: "#FE7F2D",
        draftBg: "#FFF4ED",
        draftText: "#B45309",
        pending: "#6B7280",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.02em" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "-0.01em" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        metricValue: ["28px", { lineHeight: "1.2", fontWeight: "400" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        sm: "var(--radius-sm, 12px)",
        DEFAULT: "var(--radius-md, 16px)",
        md: "var(--radius-md, 16px)",
        lg: "var(--radius-lg, 20px)",
        xl: "var(--radius-xl, 24px)",
        "2xl": "var(--radius-2xl, 28px)",
        card: "20px",
        button: "14px",
        badge: "10px",
        input: "14px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glass: "var(--shadow-glass)",
        modal: "var(--shadow-modal)",
        card: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
        cardHover: "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        sidebar: "4px 0 24px rgba(0, 0, 0, 0.06)",
      },
      backdropBlur: {
        glass: "var(--glass-blur, 40px)",
        overlay: "var(--overlay-blur, 20px)",
      },
      transitionTimingFunction: {
        liquid: "var(--ease-liquid, cubic-bezier(0.33, 1, 0.68, 1))",
        elastic: "var(--ease-elastic, cubic-bezier(0.34, 1.56, 0.64, 1))",
      },
      transitionDuration: {
        fast: "var(--duration-fast, 200ms)",
        normal: "var(--duration-normal, 320ms)",
        slow: "var(--duration-slow, 480ms)",
      },
      animation: {
        "glass-in": "glass-in var(--duration-normal) var(--ease-liquid) forwards",
        "glass-out": "glass-out var(--duration-fast) var(--ease-liquid) forwards",
        "overlay-in": "overlay-in var(--duration-normal) var(--ease-liquid) forwards",
        "overlay-out": "overlay-out var(--duration-fast) var(--ease-liquid) forwards",
      },
      keyframes: {
        "glass-in": {
          from: { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "glass-out": {
          from: { opacity: "1", transform: "scale(1) translateY(0)" },
          to: { opacity: "0", transform: "scale(0.98) translateY(4px)" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "overlay-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
