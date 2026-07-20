import { getGameConfig, getGameConfigOrFallback } from "@/lib/game-config";

/** Expansões de query — sinônimos por jogo (GameConfig) + fallback global. */

const GLOBAL_FALLBACK: Record<string, string[]> = {
  lotr: ["lord of the rings", "middle-earth"],
};

export function expandQueryTokens(query: string, gameOrSlug?: string | null): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>([normalized, ...tokens]);

  const cfg = gameOrSlug ? getGameConfig(gameOrSlug) : undefined;
  const synonymMap: Record<string, string[]> = {
    ...GLOBAL_FALLBACK,
    ...(cfg?.searchSynonyms ?? {}),
  };

  // Sem jogo explícito: merge Lorcana + MTG + Pokémon (beachhead + R2)
  if (!cfg) {
    for (const code of ["lorcana", "mtg", "pokemon"] as const) {
      const g = getGameConfig(code);
      if (g) Object.assign(synonymMap, g.searchSynonyms);
    }
  }

  for (const token of tokens) {
    const syns = synonymMap[token];
    if (syns) syns.forEach((s) => expanded.add(s));
  }

  return [...expanded];
}

export function expandQueryTokensForGame(query: string, gameOrSlug: string): string[] {
  return expandQueryTokens(query, gameOrSlug);
}

export function watchlistHints(gameOrSlug: string): string[] {
  return getGameConfigOrFallback(gameOrSlug).watchlistCardNames;
}
