import type { GameConfigOption } from "../interfaces/GameConfiguration.js";

/** Chave canônica para match value/label do provider vs GameConfiguration. */
export function rarityMatchKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function findRarityOption(
  rarities: GameConfigOption[],
  raw: string | undefined,
): GameConfigOption | undefined {
  if (!raw?.trim()) return undefined;
  const key = rarityMatchKey(raw);
  return rarities.find(
    (r) => rarityMatchKey(r.value) === key || rarityMatchKey(r.label) === key,
  );
}

/** Rótulo de exibição alinhado ao GameConfiguration (SoT do provider). */
export function displayRarityFromConfig(
  rarities: GameConfigOption[],
  raw: string | undefined,
): string | undefined {
  if (!raw?.trim()) return undefined;
  const opt = findRarityOption(rarities, raw);
  return opt?.label ?? raw.trim();
}

/** Valor normalizado (value do config) para filtros/search. */
export function normalizedRarityFromConfig(
  rarities: GameConfigOption[],
  raw: string | undefined,
): string | undefined {
  if (!raw?.trim()) return undefined;
  const opt = findRarityOption(rarities, raw);
  return opt?.value ?? raw.trim();
}
