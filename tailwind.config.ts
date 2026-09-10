import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3ff",
          100: "#dde8ff",
          200: "#c2d4ff",
          300: "#98b5ff",
          400: "#6690ff",
          500: "#3b6bf0",
          600: "#1d4ed8",
          700: "#1a3fae",
          800: "#1b378c",
          900: "#1b3373",
        },
        ink: {
          DEFAULT: "#111726",
          soft: "#3a4358",
          muted: "#6b7488",
        },
        line: "#e5e8f0",
        canvas: "#f6f7fb",
        gov: {
          navy: "#1b2a5e",
          "navy-deep": "#131f47",
          "navy-bar": "#1b2a63",
          orange: "#e8730c",
          "orange-dark": "#cc6206",
          wash: "#edf1fb",
          saffron: "#ff9933",
          green: "#138808",
          gold: "#c9a227",
        },
        risk: {
          low: "#15803d",
          "low-bg": "#e7f6ec",
          review: "#b45309",
          "review-bg": "#fdf1dd",
          high: "#b91c1c",
          "high-bg": "#fdeaea",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-deva)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 23, 38, 0.04), 0 10px 30px -12px rgba(17, 23, 38, 0.12)",
        soft: "0 1px 3px rgba(17, 23, 38, 0.09)",
        pop: "0 12px 40px -8px rgba(17, 23, 38, 0.22)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.3s ease-out both" },
    },
  },
  plugins: [],
};

export default config;
