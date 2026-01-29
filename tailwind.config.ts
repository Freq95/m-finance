import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F7FA",
        card: "#FFFFFF",
        sidebar: "#1F2937",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        textMuted: "#9CA3AF",
        accentPositive: "#10B981",
        accentNegative: "#EF4444",
        accentPrimary: "#3B82F6",
        accentPrimaryHover: "#2563EB",
        accentPrimaryActive: "#1D4ED8",
        border: "#E5E7EB",
        divider: "#E5E7EB",
        saved: "#10B981",
        savedBg: "#D1FAE5",
        savedText: "#065F46",
        draft: "#F59E0B",
        draftBg: "#FEF3C7",
        draftText: "#92400E",
        pending: "#6B7280",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "'Segoe UI'",
          "sans-serif",
        ],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.02em" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        small: ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        metricValue: ["28px", { lineHeight: "1.2", fontWeight: "700" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        cardHover: "0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        modal: "0 24px 48px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)",
        sidebar: "4px 0 24px rgba(0, 0, 0, 0.06)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        card: "16px",
        button: "10px",
        badge: "10px",
        input: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
