import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          950: "#070B14",
          900: "#0D1424",
          850: "#111B30",
          800: "#16223D",
          750: "#1C2B4C",
          700: "#22355C",
          600: "#2D4475",
        },
        brand: {
          blue: "#38bdf8",
          purple: "#a855f7",
          green: "#22c55e",
          amber: "#f59e0b",
          rose: "#f43f5e",
          emerald: "#10b981",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(56, 189, 248, 0.15)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
      }
    },
  },
  plugins: [],
};
export default config;
