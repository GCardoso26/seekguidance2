import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        luxury: {
          gold: "#d4af37",
          "gold-light": "#e8c84a",
          "gold-dark": "#a68a2e",
          silver: "#c0c0c0",
          "silver-light": "#e0e0e0",
          onyx: "#0a0a0f",
          obsidian: "#0f0f1a",
          midnight: "#1a1a2e",
          velvet: "#16213e",
          frost: "#e2e8f0",
          mist: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "gradient-shift": "gradientShift 15s ease infinite",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 8s ease-in-out infinite",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
