import type { TcgType } from "@/types/judge";

/** Cores de acento por jogo (HSL sem hsl() — usadas em var(--tcg-accent)). */
export type TcgBrand = {
  accent: string;
  accentFg: string;
  icon: string;
  publisher: string;
};

export const TCG_BRAND: Record<TcgType, TcgBrand> = {
  magic: {
    accent: "221 83% 42%",
    accentFg: "0 0% 100%",
    icon: "MTG",
    publisher: "Wizards of the Coast",
  },
  pokemon: {
    accent: "45 96% 52%",
    accentFg: "222 35% 12%",
    icon: "PKM",
    publisher: "The Pokémon Company",
  },
  lorcana: {
    accent: "270 55% 48%",
    accentFg: "0 0% 100%",
    icon: "LOR",
    publisher: "Ravensburger",
  },
  yugioh: {
    accent: "38 92% 50%",
    accentFg: "222 35% 12%",
    icon: "YGO",
    publisher: "Konami",
  },
  one_piece: {
    accent: "0 82% 52%",
    accentFg: "0 0% 100%",
    icon: "OP",
    publisher: "Bandai",
  },
  flesh_and_blood: {
    accent: "0 65% 38%",
    accentFg: "0 0% 100%",
    icon: "FAB",
    publisher: "Legend Story Studios",
  },
  gundam: {
    accent: "0 75% 46%",
    accentFg: "0 0% 100%",
    icon: "GCG",
    publisher: "Bandai",
  },
  digimon: {
    accent: "24 95% 52%",
    accentFg: "0 0% 100%",
    icon: "DGM",
    publisher: "Bandai",
  },
  dragon_ball: {
    accent: "355 85% 52%",
    accentFg: "0 0% 100%",
    icon: "DB",
    publisher: "Bandai",
  },
  sorcery: {
    accent: "25 45% 38%",
    accentFg: "0 0% 100%",
    icon: "SCR",
    publisher: "Erik's Curiosa",
  },
  vanguard: {
    accent: "350 72% 44%",
    accentFg: "0 0% 100%",
    icon: "CFV",
    publisher: "Bushiroad",
  },
  riftbound: {
    accent: "42 96% 48%",
    accentFg: "222 35% 12%",
    icon: "RBT",
    publisher: "Riot Games",
  },
  union_arena: {
    accent: "0 78% 50%",
    accentFg: "0 0% 100%",
    icon: "UA",
    publisher: "Bandai",
  },
};

export function getTcgBrand(id: TcgType): TcgBrand {
  return TCG_BRAND[id];
}
