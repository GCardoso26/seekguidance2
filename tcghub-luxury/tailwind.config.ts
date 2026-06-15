/**
 * Tailwind CSS v4 — tokens principais definidos em `src/index.css` via @theme.
 * Este ficheiro mantém compatibilidade com tooling que espera tailwind.config.
 */
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
} satisfies Config;
