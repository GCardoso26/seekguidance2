/**
 * Temas completos por TCG — variáveis CSS injetadas em :root / .judge-app.
 * Metáfora: mesa de jogo noturna com acentos da identidade de cada jogo.
 */
import type { CSSProperties } from "react";
import { contrastRatio } from "@/lib/wcag-contrast";
import type { TcgPattern } from "@/lib/tcg-brand-meta";
import type { TcgType } from "@/types/judge";

/** Superfícies e tipografia alinhadas ao design system luxury (mesa judge). */
export const LUXURY_JUDGE_SURFACES: Record<string, string> = {
  "--tcg-surface": "#0a0a0f",
  "--tcg-surface-elevated": "#161622",
  "--tcg-text-primary": "#e2e8f0",
  "--tcg-text-secondary": "#94a3b8",
  "--tcg-card-bg": "linear-gradient(145deg, rgb(255 255 255 / 0.06) 0%, rgb(10 10 15 / 0.98) 100%)",
  "--judge-surface": "240 22% 4%",
};

export type TCGTheme = {
  /** Variáveis CSS (--tcg-*) */
  css: Record<string, string>;
  /** Canais HSL sem hsl() — compat com Tailwind legado */
  accent: string;
  accentFg: string;
  headerFrom: string;
  headerTo: string;
  pattern: TcgPattern;
  icon: string;
  publisher: string;
  emoji: string;
  themeGradient: string;
};

function theme(
  partial: Omit<TCGTheme, "css"> & { css: Record<string, string> },
): TCGTheme {
  return partial;
}

export const TCG_THEMES: Record<TcgType, TCGTheme> = {
  magic: theme({
    css: {
      "--tcg-primary": "#1E3A5F",
      "--tcg-primary-light": "#4A90D9",
      "--tcg-accent": "#C9A227",
      "--tcg-surface": "#0F172A",
      "--tcg-surface-elevated": "#1E293B",
      "--tcg-text-primary": "#F1F5F9",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(74, 144, 217, 0.2)",
      "--tcg-glow": "0 0 20px rgba(74, 144, 217, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "221 83% 42%",
    accentFg: "0 0% 100%",
    headerFrom: "221 83% 38%",
    headerTo: "221 70% 28%",
    pattern: "grid",
    icon: "MTG",
    publisher: "Wizards of the Coast",
    emoji: "🃏",
    themeGradient: "linear-gradient(135deg, #1E3A5F 0%, #0F172A 55%, #C9A227 120%)",
  }),
  pokemon: theme({
    css: {
      "--tcg-primary": "#DC2626",
      "--tcg-primary-light": "#EF4444",
      "--tcg-accent": "#FACC15",
      "--tcg-surface": "#18181B",
      "--tcg-surface-elevated": "#27272A",
      "--tcg-text-primary": "#FAFAFA",
      "--tcg-text-secondary": "#A1A1AA",
      "--tcg-border": "rgba(220, 38, 38, 0.25)",
      "--tcg-glow": "0 0 20px rgba(220, 38, 38, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #27272A 0%, #18181B 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "0 72% 50%",
    accentFg: "0 0% 100%",
    headerFrom: "0 78% 46%",
    headerTo: "0 70% 36%",
    pattern: "hex",
    icon: "PKM",
    publisher: "The Pokémon Company",
    emoji: "⚡",
    themeGradient: "linear-gradient(135deg, #DC2626 0%, #18181B 50%, #FACC15 110%)",
  }),
  yugioh: theme({
    css: {
      "--tcg-primary": "#B45309",
      "--tcg-primary-light": "#F59E0B",
      "--tcg-accent": "#FDE047",
      "--tcg-surface": "#0C0A09",
      "--tcg-surface-elevated": "#1C1917",
      "--tcg-text-primary": "#FAFAF9",
      "--tcg-text-secondary": "#A8A29E",
      "--tcg-border": "rgba(245, 158, 11, 0.22)",
      "--tcg-glow": "0 0 20px rgba(245, 158, 11, 0.12)",
      "--tcg-card-bg": "linear-gradient(145deg, #1C1917 0%, #0C0A09 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "38 92% 50%",
    accentFg: "222 35% 12%",
    headerFrom: "38 88% 44%",
    headerTo: "32 80% 32%",
    pattern: "bands",
    icon: "YGO",
    publisher: "Konami",
    emoji: "👁",
    themeGradient: "linear-gradient(135deg, #B45309 0%, #0C0A09 55%, #FDE047 115%)",
  }),
  lorcana: theme({
    css: {
      "--tcg-primary": "#6D28D9",
      "--tcg-primary-light": "#A78BFA",
      "--tcg-accent": "#C4B5FD",
      "--tcg-surface": "#0F0A1A",
      "--tcg-surface-elevated": "#1E1533",
      "--tcg-text-primary": "#F5F3FF",
      "--tcg-text-secondary": "#A5B4FC",
      "--tcg-border": "rgba(167, 139, 250, 0.22)",
      "--tcg-glow": "0 0 24px rgba(109, 40, 217, 0.2)",
      "--tcg-card-bg": "linear-gradient(145deg, #1E1533 0%, #0F0A1A 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "270 55% 48%",
    accentFg: "0 0% 100%",
    headerFrom: "270 55% 42%",
    headerTo: "275 48% 30%",
    pattern: "diamond",
    icon: "LOR",
    publisher: "Ravensburger",
    emoji: "✨",
    themeGradient: "linear-gradient(135deg, #6D28D9 0%, #0F0A1A 50%, #C4B5FD 110%)",
  }),
  one_piece: theme({
    css: {
      "--tcg-primary": "#DC2626",
      "--tcg-primary-light": "#F87171",
      "--tcg-accent": "#1D4ED8",
      "--tcg-surface": "#0F172A",
      "--tcg-surface-elevated": "#1E293B",
      "--tcg-text-primary": "#F8FAFC",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(220, 38, 38, 0.2)",
      "--tcg-glow": "0 0 18px rgba(29, 78, 216, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "0 82% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "0 78% 46%",
    headerTo: "0 70% 36%",
    pattern: "bands",
    icon: "OP",
    publisher: "Bandai",
    emoji: "🏴‍☠️",
    themeGradient: "linear-gradient(135deg, #DC2626 0%, #0F172A 50%, #1D4ED8 110%)",
  }),
  flesh_and_blood: theme({
    css: {
      "--tcg-primary": "#7F1D1D",
      "--tcg-primary-light": "#B91C1C",
      "--tcg-accent": "#D4D4D8",
      "--tcg-surface": "#09090B",
      "--tcg-surface-elevated": "#18181B",
      "--tcg-text-primary": "#FAFAFA",
      "--tcg-text-secondary": "#A1A1AA",
      "--tcg-border": "rgba(185, 28, 28, 0.25)",
      "--tcg-glow": "0 0 18px rgba(127, 29, 29, 0.2)",
      "--tcg-card-bg": "linear-gradient(145deg, #18181B 0%, #09090B 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "0 65% 38%",
    accentFg: "0 0% 100%",
    headerFrom: "0 62% 34%",
    headerTo: "0 55% 24%",
    pattern: "grid",
    icon: "FAB",
    publisher: "Legend Story Studios",
    emoji: "⚔️",
    themeGradient: "linear-gradient(135deg, #7F1D1D 0%, #09090B 55%, #D4D4D8 115%)",
  }),
  gundam: theme({
    css: {
      "--tcg-primary": "#1E40AF",
      "--tcg-primary-light": "#3B82F6",
      "--tcg-accent": "#DC2626",
      "--tcg-surface": "#020617",
      "--tcg-surface-elevated": "#0F172A",
      "--tcg-text-primary": "#F1F5F9",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(59, 130, 246, 0.2)",
      "--tcg-glow": "0 0 20px rgba(30, 64, 175, 0.18)",
      "--tcg-card-bg": "linear-gradient(145deg, #0F172A 0%, #020617 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "0 75% 46%",
    accentFg: "0 0% 100%",
    headerFrom: "0 72% 40%",
    headerTo: "0 65% 30%",
    pattern: "bands",
    icon: "GCG",
    publisher: "Bandai",
    emoji: "🤖",
    themeGradient: "linear-gradient(135deg, #1E40AF 0%, #020617 50%, #DC2626 110%)",
  }),
  digimon: theme({
    css: {
      "--tcg-primary": "#EA580C",
      "--tcg-primary-light": "#FB923C",
      "--tcg-accent": "#2563EB",
      "--tcg-surface": "#0C0A09",
      "--tcg-surface-elevated": "#1C1917",
      "--tcg-text-primary": "#FAFAF9",
      "--tcg-text-secondary": "#A8A29E",
      "--tcg-border": "rgba(234, 88, 12, 0.22)",
      "--tcg-glow": "0 0 18px rgba(37, 99, 235, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #1C1917 0%, #0C0A09 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "24 95% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "24 90% 46%",
    headerTo: "20 82% 34%",
    pattern: "hex",
    icon: "DGM",
    publisher: "Bandai",
    emoji: "🦖",
    themeGradient: "linear-gradient(135deg, #EA580C 0%, #0C0A09 50%, #2563EB 110%)",
  }),
  dragon_ball: theme({
    css: {
      "--tcg-primary": "#DC2626",
      "--tcg-primary-light": "#F97316",
      "--tcg-accent": "#FACC15",
      "--tcg-surface": "#0F172A",
      "--tcg-surface-elevated": "#1E293B",
      "--tcg-text-primary": "#F8FAFC",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(249, 115, 22, 0.22)",
      "--tcg-glow": "0 0 20px rgba(220, 38, 38, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "355 85% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "355 80% 46%",
    headerTo: "350 72% 34%",
    pattern: "bands",
    icon: "DB",
    publisher: "Bandai",
    emoji: "🐉",
    themeGradient: "linear-gradient(135deg, #DC2626 0%, #0F172A 50%, #FACC15 110%)",
  }),
  sorcery: theme({
    css: {
      "--tcg-primary": "#57534E",
      "--tcg-primary-light": "#78716C",
      "--tcg-accent": "#A8A29E",
      "--tcg-surface": "#0C0A09",
      "--tcg-surface-elevated": "#1C1917",
      "--tcg-text-primary": "#FAFAF9",
      "--tcg-text-secondary": "#A8A29E",
      "--tcg-border": "rgba(168, 162, 158, 0.2)",
      "--tcg-glow": "0 0 16px rgba(87, 83, 78, 0.2)",
      "--tcg-card-bg": "linear-gradient(145deg, #1C1917 0%, #0C0A09 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "25 45% 38%",
    accentFg: "0 0% 100%",
    headerFrom: "25 42% 32%",
    headerTo: "22 38% 22%",
    pattern: "diamond",
    icon: "SCR",
    publisher: "Erik's Curiosa",
    emoji: "🔮",
    themeGradient: "linear-gradient(135deg, #57534E 0%, #0C0A09 55%, #A8A29E 115%)",
  }),
  vanguard: theme({
    css: {
      "--tcg-primary": "#BE123C",
      "--tcg-primary-light": "#F43F5E",
      "--tcg-accent": "#FDE047",
      "--tcg-surface": "#0F172A",
      "--tcg-surface-elevated": "#1E293B",
      "--tcg-text-primary": "#F1F5F9",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(244, 63, 94, 0.2)",
      "--tcg-glow": "0 0 18px rgba(190, 18, 60, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "350 72% 44%",
    accentFg: "0 0% 100%",
    headerFrom: "350 68% 38%",
    headerTo: "345 62% 28%",
    pattern: "grid",
    icon: "CFV",
    publisher: "Bushiroad",
    emoji: "🛡",
    themeGradient: "linear-gradient(135deg, #BE123C 0%, #0F172A 50%, #FDE047 110%)",
  }),
  riftbound: theme({
    css: {
      "--tcg-primary": "#CA8A04",
      "--tcg-primary-light": "#EAB308",
      "--tcg-accent": "#7C3AED",
      "--tcg-surface": "#0F172A",
      "--tcg-surface-elevated": "#1E293B",
      "--tcg-text-primary": "#F8FAFC",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(234, 179, 8, 0.22)",
      "--tcg-glow": "0 0 18px rgba(124, 58, 237, 0.15)",
      "--tcg-card-bg": "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "42 96% 48%",
    accentFg: "222 35% 12%",
    headerFrom: "42 92% 42%",
    headerTo: "38 85% 30%",
    pattern: "hex",
    icon: "RBT",
    publisher: "Riot Games",
    emoji: "⚡",
    themeGradient: "linear-gradient(135deg, #CA8A04 0%, #0F172A 50%, #7C3AED 110%)",
  }),
  union_arena: theme({
    css: {
      "--tcg-primary": "#DC2626",
      "--tcg-primary-light": "#F87171",
      "--tcg-accent": "#FFFFFF",
      "--tcg-surface": "#09090B",
      "--tcg-surface-elevated": "#18181B",
      "--tcg-text-primary": "#FAFAFA",
      "--tcg-text-secondary": "#A1A1AA",
      "--tcg-border": "rgba(220, 38, 38, 0.22)",
      "--tcg-glow": "0 0 18px rgba(255, 255, 255, 0.08)",
      "--tcg-card-bg": "linear-gradient(145deg, #18181B 0%, #09090B 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "0 78% 50%",
    accentFg: "0 0% 100%",
    headerFrom: "0 75% 44%",
    headerTo: "0 68% 32%",
    pattern: "bands",
    icon: "UA",
    publisher: "Bandai",
    emoji: "🎴",
    themeGradient: "linear-gradient(135deg, #DC2626 0%, #09090B 50%, #FFFFFF 110%)",
  }),
  star_wars_unlimited: theme({
    css: {
      "--tcg-primary": "#1E3A8A",
      "--tcg-primary-light": "#3B82F6",
      "--tcg-accent": "#94A3B8",
      "--tcg-surface": "#020617",
      "--tcg-surface-elevated": "#0F172A",
      "--tcg-text-primary": "#F1F5F9",
      "--tcg-text-secondary": "#94A3B8",
      "--tcg-border": "rgba(59, 130, 246, 0.2)",
      "--tcg-glow": "0 0 22px rgba(30, 58, 138, 0.2)",
      "--tcg-card-bg": "linear-gradient(145deg, #0F172A 0%, #020617 100%)",
      "--tcg-verdict-permitido": "#22C55E",
      "--tcg-verdict-nao-permitido": "#EF4444",
      "--tcg-verdict-depende": "#EAB308",
    },
    accent: "210 65% 42%",
    accentFg: "0 0% 100%",
    headerFrom: "210 62% 36%",
    headerTo: "215 55% 26%",
    pattern: "hex",
    icon: "SWU",
    publisher: "Fantasy Flight Games",
    emoji: "⭐",
    themeGradient: "linear-gradient(135deg, #1E3A8A 0%, #020617 50%, #94A3B8 110%)",
  }),
};

export function getTcgTheme(id: TcgType): TCGTheme {
  return TCG_THEMES[id];
}

/** Injeta variáveis no elemento (tipicamente documentElement ou .judge-app). */
export function applyTcgThemeVars(el: HTMLElement, id: TcgType): void {
  const t = getTcgTheme(id);
  el.setAttribute("data-tcg", id);
  el.setAttribute("data-pattern", t.pattern);
  for (const [key, value] of Object.entries(t.css)) {
    el.style.setProperty(key, value);
  }
  for (const [key, value] of Object.entries(LUXURY_JUDGE_SURFACES)) {
    el.style.setProperty(key, value);
  }
  el.style.setProperty("--tcg-accent", t.accent);
  el.style.setProperty("--tcg-accent-fg", t.accentFg);
  el.style.setProperty("--judge-header-from", t.headerFrom);
  el.style.setProperty("--judge-header-to", t.headerTo);
}

export function tcgThemeStyle(id: TcgType): CSSProperties {
  const t = getTcgTheme(id);
  return {
    ...t.css,
    ...LUXURY_JUDGE_SURFACES,
    "--tcg-accent": t.accent,
    "--tcg-accent-fg": t.accentFg,
    "--judge-header-from": t.headerFrom,
    "--judge-header-to": t.headerTo,
  } as CSSProperties;
}

export function verdictColorVar(
  verdictLabel: string | null | undefined,
): string {
  const v = (verdictLabel ?? "").toLowerCase();
  if (v.includes("não") || v.includes("nao") || v.includes("proib")) {
    return "var(--tcg-verdict-nao-permitido)";
  }
  if (v.includes("depende") || v.includes("condicion")) {
    return "var(--tcg-verdict-depende)";
  }
  return "var(--tcg-verdict-permitido)";
}

/** Contraste texto primário / superfície elevada — validado em CI (≥ 4.5 AA). */
export const THEME_CONTRAST_RATIOS: Record<TcgType, number> = Object.fromEntries(
  (Object.keys(TCG_THEMES) as TcgType[]).map((id) => {
    const css = TCG_THEMES[id].css;
    const ratio = contrastRatio(
      css["--tcg-text-primary"],
      css["--tcg-surface-elevated"],
    );
    return [id, Math.round(ratio * 10) / 10];
  }),
) as Record<TcgType, number>;

export { getAccessibleTextColor } from "@/lib/wcag-contrast";
