import type { CSSProperties } from "react";
import { getTcgTheme, tcgThemeStyle as themeStyle } from "@/styles/tcg-theme";
import type { TcgPattern } from "@/lib/tcg-brand-meta";
import type { TcgType } from "@/types/judge";

export type { TcgPattern };

/** @deprecated Preferir getTcgTheme — mantido para compatibilidade. */
export type TcgBrand = {
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

export function getTcgBrand(id: TcgType): TcgBrand {
  const t = getTcgTheme(id);
  return {
    accent: t.accent,
    accentFg: t.accentFg,
    headerFrom: t.headerFrom,
    headerTo: t.headerTo,
    pattern: t.pattern,
    icon: t.icon,
    publisher: t.publisher,
    emoji: t.emoji,
    themeGradient: t.themeGradient,
  };
}

/** Alias histórico — derivado dos temas completos. */
export const TCG_BRAND = new Proxy({} as Record<TcgType, TcgBrand>, {
  get(_target, prop: string) {
    if (prop in TCG_THEMES_KEYS) {
      return getTcgBrand(prop as TcgType);
    }
    return undefined;
  },
});

const TCG_THEMES_KEYS = {
  magic: true,
  pokemon: true,
  yugioh: true,
  lorcana: true,
  one_piece: true,
  flesh_and_blood: true,
  gundam: true,
  digimon: true,
  dragon_ball: true,
  sorcery: true,
  vanguard: true,
  riftbound: true,
  union_arena: true,
  star_wars_unlimited: true,
} as const;

export function tcgThemeStyle(id: TcgType): CSSProperties {
  return themeStyle(id);
}
