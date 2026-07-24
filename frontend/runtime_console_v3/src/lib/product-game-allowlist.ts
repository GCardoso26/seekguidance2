/**
 * ADR-016 — Hard-exit do ecossistema de produto para SWU, VANGUARD e UARENA.
 *
 * Estes jogos permanecem nos tipos (`GameId`, `GAME_TOKENS`) para preservar dados
 * históricos (torneios passados, decks salvos, cartas já indexadas), mas NÃO podem
 * aparecer em nenhuma lista de produto voltada ao usuário (marketplace, seller,
 * torneios, busca, onboarding, etc.) até uma futura ADR reverter esta decisão.
 */
export const PRODUCT_ECOSYSTEM_DENYLIST = ["SWU", "VANGUARD", "UARENA"] as const;

export type ProductDenylistGameId = (typeof PRODUCT_ECOSYSTEM_DENYLIST)[number];

const DENYLIST_ID_SET = new Set<string>(PRODUCT_ECOSYSTEM_DENYLIST);

/** Slugs/aliases normalizados (sem espaços, hífens ou underscores, lowercase). */
const DENYLIST_SLUG_ALIASES = new Set<string>([
  "swu",
  "starwars",
  "starwarsunlimited",
  "vanguard",
  "cardfightvanguard",
  "uarena",
  "unionarena",
]);

function normalizeToId(value: string): string {
  return value.trim().toUpperCase().replace(/[-\s]+/g, "_");
}

function normalizeToSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[-_\s]+/g, "");
}

/**
 * Retorna true se o GameId (ex.: "SWU") ou qualquer variação de slug/alias
 * (ex.: "union-arena", "union_arena", "UnionArena", "star-wars-unlimited")
 * corresponder a um jogo com hard-exit do ecossistema de produto.
 */
export function isProductEcosystemDenied(gameIdOrSlug: string | null | undefined): boolean {
  if (!gameIdOrSlug) return false;
  const raw = gameIdOrSlug.trim();
  if (!raw) return false;

  if (DENYLIST_ID_SET.has(normalizeToId(raw))) return true;

  const slug = normalizeToSlug(raw);
  if (DENYLIST_SLUG_ALIASES.has(slug)) return true;

  return false;
}
