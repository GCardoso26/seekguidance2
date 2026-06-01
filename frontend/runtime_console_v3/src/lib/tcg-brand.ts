import type { CSSProperties } from "react";
import type { TcgType } from "@/types/judge";

/** Cores de acento por jogo (HSL sem hsl() — usadas em var(--tcg-accent)). */
export type TcgPattern = "grid" | "hex" | "dots" | "bands" | "diamond";

export type TcgBrand = {
  accent: string;
  accentFg: string;
  headerFrom: string;
  headerTo: string;
  pattern: TcgPattern;
  icon: string;
  publisher: string;
};

export const TCG_BRAND: Record<TcgType, TcgBrand> = {
  magic: {
    accent: "221 83% 42%",
    accentFg: "0 0% 100%",
    headerFrom: "221 83% 38%",
    headerTo: "221 70% 28%",
    pattern: "grid",
    icon: "MTG",
    publisher: "Wizards of the Coast",
  },
  pokemon: {
    accent: "45 96% 52%",
    accentFg: "222 35% 12%",
    headerFrom: "42 92% 46%",
    headerTo: "38 85% 34%",
    pattern: "hex",
    icon: "PKM",
    publisher: "The Pokémon Company",
  },
  lorcana: {
    accent: "270 55% 48%",
    accentFg: "0 0% 100%",
    headerFrom: "270 55% 42%",
    headerTo: "275 48% 30%",
    pattern: "diamond",
    icon: "LOR",
    publisher: "Ravensburger",
  },
  yugioh: {
    accent: "38 92% 50%",
    accentFg: "222 35% 12%",
    headerFrom: "38 88% 44%",
    headerTo: "32 80% 32%",
    pattern: "bands",
    icon: "YGO",
    publisher: "Konami",
  },
  one_piece: {
    accent: "0 82% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "0 78% 46%",
    headerTo: "0 70% 36%",
    pattern: "bands",
    icon: "OP",
    publisher: "Bandai",
  },
  flesh_and_blood: {
    accent: "0 65% 38%",
    accentFg: "0 0% 100%",
    headerFrom: "0 62% 34%",
    headerTo: "0 55% 24%",
    pattern: "grid",
    icon: "FAB",
    publisher: "Legend Story Studios",
  },
  gundam: {
    accent: "0 75% 46%",
    accentFg: "0 0% 100%",
    headerFrom: "0 72% 40%",
    headerTo: "0 65% 30%",
    pattern: "bands",
    icon: "GCG",
    publisher: "Bandai",
  },
  digimon: {
    accent: "24 95% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "24 90% 46%",
    headerTo: "20 82% 34%",
    pattern: "hex",
    icon: "DGM",
    publisher: "Bandai",
  },
  dragon_ball: {
    accent: "355 85% 52%",
    accentFg: "0 0% 100%",
    headerFrom: "355 80% 46%",
    headerTo: "350 72% 34%",
    pattern: "bands",
    icon: "DB",
    publisher: "Bandai",
  },
  sorcery: {
    accent: "25 45% 38%",
    accentFg: "0 0% 100%",
    headerFrom: "25 42% 32%",
    headerTo: "22 38% 22%",
    pattern: "diamond",
    icon: "SCR",
    publisher: "Erik's Curiosa",
  },
  vanguard: {
    accent: "350 72% 44%",
    accentFg: "0 0% 100%",
    headerFrom: "350 68% 38%",
    headerTo: "345 62% 28%",
    pattern: "grid",
    icon: "CFV",
    publisher: "Bushiroad",
  },
  riftbound: {
    accent: "42 96% 48%",
    accentFg: "222 35% 12%",
    headerFrom: "42 92% 42%",
    headerTo: "38 85% 30%",
    pattern: "hex",
    icon: "RBT",
    publisher: "Riot Games",
  },
  union_arena: {
    accent: "0 78% 50%",
    accentFg: "0 0% 100%",
    headerFrom: "0 75% 44%",
    headerTo: "0 68% 32%",
    pattern: "bands",
    icon: "UA",
    publisher: "Bandai",
  },
  star_wars_unlimited: {
    accent: "210 65% 42%",
    accentFg: "0 0% 100%",
    headerFrom: "210 62% 36%",
    headerTo: "215 55% 26%",
    pattern: "hex",
    icon: "SWU",
    publisher: "Fantasy Flight Games",
  },
};

export function getTcgBrand(id: TcgType): TcgBrand {
  return TCG_BRAND[id];
}

export function tcgThemeStyle(id: TcgType): CSSProperties {
  const brand = getTcgBrand(id);
  return {
    "--tcg-accent": brand.accent,
    "--tcg-accent-fg": brand.accentFg,
    "--judge-header-from": brand.headerFrom,
    "--judge-header-to": brand.headerTo,
  } as CSSProperties;
}
