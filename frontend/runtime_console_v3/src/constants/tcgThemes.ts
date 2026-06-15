import type { TcgType } from "@/types/judge";

export type TcgGradientStops = readonly [string, string, string];

/** Gradiente padrão quando nenhum TCG tem tema dedicado. */
export const DEFAULT_TCG_GRADIENT: TcgGradientStops = ["#0f172a", "#1e293b", "#020617"];

/**
 * Cores características por TCG (especificação do produto).
 * Chaves alinhadas a `TcgType`; aliases com hífen para documentação.
 */
export const TCG_BACKGROUND_GRADIENTS: Partial<Record<TcgType, TcgGradientStops>> = {
  yugioh: ["#7c2d12", "#dc2626", "#991b1b"],
  digimon: ["#78350f", "#f59e0b", "#b45309"],
  lorcana: ["#4c1d95", "#8b5cf6", "#6d28d9"],
  dragon_ball: ["#9a3412", "#f97316", "#ea580c"],
  flesh_and_blood: ["#450a0a", "#dc2626", "#991b1b"],
  magic: ["#1e3a8a", "#3b82f6", "#1d4ed8"],
};

export function tcgGradientCss(stops: TcgGradientStops): string {
  return `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 50%, ${stops[2]} 100%)`;
}

export function getTcgBackgroundGradient(tcg: TcgType | null | undefined): string {
  if (!tcg) return tcgGradientCss(DEFAULT_TCG_GRADIENT);
  const stops = TCG_BACKGROUND_GRADIENTS[tcg];
  return stops ? tcgGradientCss(stops) : tcgGradientCss(DEFAULT_TCG_GRADIENT);
}
