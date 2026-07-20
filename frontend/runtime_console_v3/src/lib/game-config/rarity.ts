import type { GameConfigOption } from "@/lib/game-config";
import { getGameConfig } from "@/lib/game-config";

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

export function getRarityOptions(gameOrSlug: string | undefined | null): GameConfigOption[] {
  return getGameConfig(gameOrSlug)?.rarities ?? [];
}

export function formatRarityDisplay(
  gameOrSlug: string | undefined | null,
  rawRarity: string | undefined | null,
): string {
  if (!rawRarity?.trim()) return "";
  const cfg = getGameConfig(gameOrSlug);
  if (!cfg) return rawRarity.trim();
  return findRarityOption(cfg.rarities, rawRarity)?.label ?? rawRarity.trim();
}

export function normalizedRarityValue(
  gameOrSlug: string | undefined | null,
  rawRarity: string | undefined | null,
): string {
  if (!rawRarity?.trim()) return "";
  const cfg = getGameConfig(gameOrSlug);
  if (!cfg) return rawRarity.trim();
  return findRarityOption(cfg.rarities, rawRarity)?.value ?? rawRarity.trim();
}

export function isRarityAllowedForGame(
  gameOrSlug: string | undefined | null,
  value: string,
): boolean {
  const cfg = getGameConfig(gameOrSlug);
  if (!cfg) return true;
  return findRarityOption(cfg.rarities, value) !== undefined;
}

/** Valores para autocomplete de search syntax — só do GameConfiguration. */
export function getRaritySyntaxValues(gameOrSlug: string | undefined | null): string[] {
  const cfg = getGameConfig(gameOrSlug);
  if (!cfg) return [];
  const out = new Set<string>();
  for (const r of cfg.rarities) {
    out.add(r.value);
    out.add(r.label);
  }
  return [...out];
}

export function gameHasLorcanaOnlyRarity(
  gameOrSlug: string | undefined | null,
  rawRarity: string,
): boolean {
  const key = rarityMatchKey(rawRarity);
  const lorcanaOnly = ["legendary", "enchanted", "super_rare"];
  if (!lorcanaOnly.includes(key) && !lorcanaOnly.includes(rarityMatchKey(rawRarity))) {
    return false;
  }
  const cfg = getGameConfig(gameOrSlug);
  if (!cfg) return false;
  return cfg.gameCode !== "LORCANA" && findRarityOption(cfg.rarities, rawRarity) === undefined;
}
