/**
 * Temas por TCG — Galeria (design.md §7–§8).
 * Cada jogo expõe apenas um selo de taxonomia derivado do accent.
 * Superfícies escuras (Noite de Leilão) vivem em LUXURY_JUDGE_SURFACES
 * e só entram via applyAuctionNightVars — nunca por padrão.
 */
import type { CSSProperties } from "react";
import { contrastRatio } from "@/lib/wcag-contrast";
import type { TcgPattern } from "@/lib/tcg-brand-meta";
import type { TcgType } from "@/types/judge";

/**
 * Noite de Leilão — tokens canônicos escuros (reservados).
 * Aplicar somente com applyAuctionNightVars / data-shell="auction".
 */
export const LUXURY_JUDGE_SURFACES: Record<string, string> = {
  "--tcg-surface": "hsl(216 31% 9%)",
  "--tcg-surface-elevated": "hsl(216 22% 16%)",
  "--tcg-text-primary": "hsl(44 16% 90%)",
  "--tcg-text-secondary": "hsl(214 12% 62%)",
  "--tcg-card-bg": "hsl(216 22% 16%)",
  "--judge-surface": "216 31% 9%",
  "--auction-bg": "216 31% 9%",
  "--auction-surface": "216 22% 16%",
  "--auction-fg": "44 16% 90%",
  "--auction-muted": "214 12% 62%",
};

export type TCGTheme = {
  /** Variáveis CSS mínimas (--tcg-seal / accent / verdict) — sem superfícies */
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
  /** Tint sutil do selo sobre transparente — não lava o shell */
  themeGradient: string;
  /**
   * ADR-016: jogos com hard-exit do ecossistema de produto
   * (histórico/admin; sem landing nem selo de vitrine).
   */
  hardExit?: boolean;
};

const VERDICT_CSS = {
  "--tcg-verdict-permitido": "#22C55E",
  "--tcg-verdict-nao-permitido": "#EF4444",
  "--tcg-verdict-depende": "#EAB308",
} as const;

function sealCss(accent: string, accentFg: string): Record<string, string> {
  return {
    "--tcg-seal": accent,
    "--tcg-accent": accent,
    "--tcg-accent-fg": accentFg,
    ...VERDICT_CSS,
  };
}

function sealTint(accent: string): string {
  return `linear-gradient(135deg, hsl(${accent} / 0.12), transparent)`;
}

function theme(
  partial: Omit<TCGTheme, "css"> & { css?: Record<string, string> },
): TCGTheme {
  const css = partial.css ?? sealCss(partial.accent, partial.accentFg);
  return { ...partial, css };
}

export const TCG_THEMES: Record<TcgType, TCGTheme> = {
  magic: theme({
    accent: "221 83% 42%",
    accentFg: "0 0% 100%",
    headerFrom: "221 83% 38%",
    headerTo: "221 70% 28%",
    pattern: "grid",
    icon: "MTG",
    publisher: "Wizards of the Coast",
    emoji: "🃏",
    themeGradient: sealTint("221 83% 42%"),
  }),
  pokemon: theme({
    accent: "0 72% 50%",
    accentFg: "0 0% 100%",
    headerFrom: "0 78% 46%",
    headerTo: "0 70% 36%",
    pattern: "hex",
    icon: "PKM",
    publisher: "The Pokémon Company",
    emoji: "⚡",
    themeGradient: sealTint("0 72% 50%"),
  }),
  yugioh: theme({
    accent: "38 92% 50%",
    accentFg: "222 35% 12%",
    headerFrom: "38 88% 44%",
    headerTo: "32 80% 32%",
    pattern: "bands",
    icon: "YGO",
    publisher: "Konami",
    emoji: "👁",
    themeGradient: sealTint("38 92% 50%"),
  }),
  lorcana: theme({
    accent: "270 55% 48%",
    accentFg: "0 0% 100%",
    headerFrom: "270 55% 42%",
    headerTo: "275 48% 30%",
    pattern: "diamond",
    icon: "LOR",
    publisher: "Ravensburger",
    emoji: "✨",
    themeGradient: sealTint("270 55% 48%"),
  }),
  one_piece: theme({
    accent: "0 82% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "0 78% 46%",
    headerTo: "0 70% 36%",
    pattern: "bands",
    icon: "OP",
    publisher: "Bandai",
    emoji: "🏴‍☠️",
    themeGradient: sealTint("0 82% 52%"),
  }),
  flesh_and_blood: theme({
    accent: "0 65% 38%",
    accentFg: "0 0% 100%",
    headerFrom: "0 62% 34%",
    headerTo: "0 55% 24%",
    pattern: "grid",
    icon: "FAB",
    publisher: "Legend Story Studios",
    emoji: "⚔️",
    themeGradient: sealTint("0 65% 38%"),
  }),
  gundam: theme({
    accent: "0 75% 46%",
    accentFg: "0 0% 100%",
    headerFrom: "0 72% 40%",
    headerTo: "0 65% 30%",
    pattern: "bands",
    icon: "GCG",
    publisher: "Bandai",
    emoji: "🤖",
    themeGradient: sealTint("0 75% 46%"),
  }),
  digimon: theme({
    accent: "24 95% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "24 90% 46%",
    headerTo: "20 82% 34%",
    pattern: "hex",
    icon: "DGM",
    publisher: "Bandai",
    emoji: "🦖",
    themeGradient: sealTint("24 95% 52%"),
  }),
  dragon_ball: theme({
    accent: "355 85% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "355 80% 46%",
    headerTo: "350 72% 34%",
    pattern: "bands",
    icon: "DB",
    publisher: "Bandai",
    emoji: "🐉",
    themeGradient: sealTint("355 85% 52%"),
  }),
  sorcery: theme({
    accent: "25 45% 38%",
    accentFg: "0 0% 100%",
    headerFrom: "25 42% 32%",
    headerTo: "22 38% 22%",
    pattern: "diamond",
    icon: "SCR",
    publisher: "Erik's Curiosa",
    emoji: "🔮",
    themeGradient: sealTint("25 45% 38%"),
  }),
  riftbound: theme({
    accent: "42 96% 48%",
    accentFg: "222 35% 12%",
    headerFrom: "42 92% 42%",
    headerTo: "38 85% 30%",
    pattern: "hex",
    icon: "RBT",
    publisher: "Riot Games",
    emoji: "⚡",
    themeGradient: sealTint("42 96% 48%"),
  }),
  /** ADR-016 hard-exit — histórico/admin; sem landing de produto. */
  vanguard: theme({
    hardExit: true,
    accent: "350 72% 44%",
    accentFg: "0 0% 100%",
    headerFrom: "350 68% 38%",
    headerTo: "345 62% 28%",
    pattern: "grid",
    icon: "CFV",
    publisher: "Bushiroad",
    emoji: "🛡",
    themeGradient: sealTint("350 72% 44%"),
  }),
  /** ADR-016 hard-exit — histórico/admin; sem landing de produto. */
  union_arena: theme({
    hardExit: true,
    accent: "0 78% 50%",
    accentFg: "0 0% 100%",
    headerFrom: "0 75% 44%",
    headerTo: "0 68% 32%",
    pattern: "bands",
    icon: "UA",
    publisher: "Bandai",
    emoji: "🎴",
    themeGradient: sealTint("0 78% 50%"),
  }),
  /** ADR-016 hard-exit — histórico/admin; sem landing de produto. */
  star_wars_unlimited: theme({
    hardExit: true,
    accent: "210 65% 42%",
    accentFg: "0 0% 100%",
    headerFrom: "210 62% 36%",
    headerTo: "215 55% 26%",
    pattern: "hex",
    icon: "SWU",
    publisher: "Fantasy Flight Games",
    emoji: "⭐",
    themeGradient: sealTint("210 65% 42%"),
  }),
};

export function getTcgTheme(id: TcgType): TCGTheme {
  return TCG_THEMES[id];
}

/** Injeta selo/accent no elemento — não aplica Noite de Leilão. */
export function applyTcgThemeVars(el: HTMLElement, id: TcgType): void {
  const t = getTcgTheme(id);
  el.setAttribute("data-tcg", id);
  el.setAttribute("data-pattern", t.pattern);
  for (const [key, value] of Object.entries(t.css)) {
    el.style.setProperty(key, value);
  }
  el.style.setProperty("--tcg-accent", t.accent);
  el.style.setProperty("--tcg-accent-fg", t.accentFg);
  el.style.setProperty("--judge-header-from", t.headerFrom);
  el.style.setProperty("--judge-header-to", t.headerTo);
}

/** Aplica Noite de Leilão (LUXURY_JUDGE_SURFACES) + data-shell="auction". */
export function applyAuctionNightVars(el: HTMLElement): void {
  el.setAttribute("data-shell", "auction");
  for (const [key, value] of Object.entries(LUXURY_JUDGE_SURFACES)) {
    el.style.setProperty(key, value);
  }
}

/** Estilo React: apenas selo/accent — sem superfícies de leilão. */
export function tcgThemeStyle(id: TcgType): CSSProperties {
  const t = getTcgTheme(id);
  return {
    ...t.css,
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

/** Converte `hsl(H S% L%)` ou canais `H S% L%` em hex para contrastRatio. */
function hslLikeToHex(value: string): string {
  const m = value
    .trim()
    .match(
      /^(?:hsl\(\s*)?([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)?$/i,
    );
  if (!m) return value;
  const h = Number(m[1]);
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mid = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toByte = (n: number) =>
    Math.round((n + mid) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/**
 * Contraste texto / superfície elevada da Noite de Leilão (canônico).
 * Temas Galeria não pintam shell — o AA relevante é o escuro reservado.
 */
const auctionNightContrast = (() => {
  const fg = hslLikeToHex(LUXURY_JUDGE_SURFACES["--tcg-text-primary"]);
  const bg = hslLikeToHex(LUXURY_JUDGE_SURFACES["--tcg-surface-elevated"]);
  return Math.round(contrastRatio(fg, bg) * 10) / 10;
})();

export const THEME_CONTRAST_RATIOS: Record<TcgType, number> = Object.fromEntries(
  (Object.keys(TCG_THEMES) as TcgType[]).map((id) => [id, auctionNightContrast]),
) as Record<TcgType, number>;

export { getAccessibleTextColor } from "@/lib/wcag-contrast";
