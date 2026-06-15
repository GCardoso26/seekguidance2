import type { TcgType } from "@/types/judge";

export type TcgGradientStops = readonly [string, string, string];

/** Gradiente padrão — paleta luxury onyx. */
export const DEFAULT_TCG_GRADIENT: TcgGradientStops = ["#0a0a0f", "#12121c", "#1a1a2e"];

/**
 * Gradientes de fundo por TCG — tons escuros luxury com acento sutil do jogo.
 */
export const TCG_BACKGROUND_GRADIENTS: Partial<Record<TcgType, TcgGradientStops>> = {
  magic: ["#0a0a0f", "#101828", "#1a1a2e"],
  pokemon: ["#0a0a0f", "#1a1214", "#1a1a2e"],
  yugioh: ["#0a0a0f", "#1a1410", "#1a1a2e"],
  lorcana: ["#0a0a0f", "#151025", "#1a1a2e"],
  digimon: ["#0a0a0f", "#1a1510", "#1a1a2e"],
  dragon_ball: ["#0a0a0f", "#1a120e", "#1a1a2e"],
  flesh_and_blood: ["#0a0a0f", "#1a1010", "#1a1a2e"],
};

export function tcgGradientCss(stops: TcgGradientStops): string {
  return `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 50%, ${stops[2]} 100%)`;
}

export function getTcgBackgroundGradient(tcg: TcgType | null | undefined): string {
  if (!tcg) return tcgGradientCss(DEFAULT_TCG_GRADIENT);
  const stops = TCG_BACKGROUND_GRADIENTS[tcg];
  return stops ? tcgGradientCss(stops) : tcgGradientCss(DEFAULT_TCG_GRADIENT);
}
