/**
 * Live Data Platform — fetch helpers over public BFFs only (ADR-011).
 * No domain logic — composition for "living product" surfaces.
 */

export type LiveDeck = { id: string; name?: string; title?: string; likes?: number; updatedAt?: string };
export type LiveMover = {
  card_id?: string;
  id?: string;
  name?: string;
  change_pct?: number;
  direction?: "up" | "down" | string;
  game?: string;
};
export type LiveSet = { code: string; name: string };
export type LiveEvent = {
  id: string;
  name?: string;
  title?: string;
  starts_at?: string;
  status?: string;
  game?: string;
  format?: string;
  banner_url?: string | null;
  image_url?: string | null;
  venue?: string | null;
  capacity?: number | null;
  store_id?: string;
  store_name?: string | null;
  store_slug?: string | null;
  policies?: Record<string, unknown>;
  tickets_remaining?: number | null;
  tickets_capacity?: number | null;
  tickets_sold?: number | null;
  price_cents?: number | null;
  store_city?: string | null;
  store_state?: string | null;
  store_postal_code?: string | null;
};

async function softJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchPublicDecks(limit = 8, game?: string): Promise<LiveDeck[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (game) qs.set("game", game);
  const data = await softJson<{ decks?: LiveDeck[]; items?: LiveDeck[] }>(
    `/api/decks/public?${qs}`,
    {},
  );
  return (data.decks ?? data.items ?? []).slice(0, limit);
}

export async function fetchTopMovers(limit = 8): Promise<{
  gainers: LiveMover[];
  losers: LiveMover[];
}> {
  const data = await softJson<{
    gainers?: LiveMover[];
    losers?: LiveMover[];
    movers?: LiveMover[];
    items?: LiveMover[];
  }>(`/api/runtime/top-movers?limit=${limit}`, {});
  const movers = data.movers ?? data.items ?? [];
  const gainers =
    data.gainers ??
    movers.filter((m) => (m.change_pct ?? 0) > 0 || m.direction === "up").slice(0, limit);
  const losers =
    data.losers ??
    movers.filter((m) => (m.change_pct ?? 0) < 0 || m.direction === "down").slice(0, limit);
  return { gainers: gainers.slice(0, limit), losers: losers.slice(0, limit) };
}

export async function fetchTrends(limit = 8): Promise<LiveMover[]> {
  const data = await softJson<{ cards?: LiveMover[]; items?: LiveMover[]; trends?: LiveMover[] }>(
    `/api/trends?limit=${limit}`,
    {},
  );
  return (data.cards ?? data.items ?? data.trends ?? []).slice(0, limit);
}

export async function fetchRecentSets(game: string, limit = 6): Promise<LiveSet[]> {
  const data = await softJson<{ sets?: LiveSet[] }>(
    `/api/catalog/sets?game=${encodeURIComponent(game)}&limit=${limit}`,
    {},
  );
  return (data.sets ?? []).slice(0, limit);
}

export async function fetchPublicEvents(limit = 6): Promise<LiveEvent[]> {
  const data = await softJson<{ events?: LiveEvent[]; items?: LiveEvent[] }>(
    `/api/tournament-platform/events?limit=${limit}`,
    {},
  );
  return (data.events ?? data.items ?? []).slice(0, limit);
}

export async function fetchBuyerRecommendations(limit = 8): Promise<{
  you_may_like?: Array<{ id?: string; name?: string; href?: string; reason?: string }>;
  frequently_bought_together?: Array<{ id?: string; name?: string }>;
  upgrades?: Array<{ id?: string; name?: string }>;
}> {
  return softJson(`/api/buyer/recommendations?limit=${limit}`, {});
}

export async function fetchCollectionInsights(): Promise<{
  completionPct?: number;
  totalValue?: number;
  valueChangeToday?: number;
  topGainer?: { name?: string; changePct?: number };
  topLoser?: { name?: string; changePct?: number };
  recentAcquisitions?: Array<{ id?: string; name?: string; acquiredAt?: string }>;
  missingCount?: number;
}> {
  return softJson(`/api/user/collection/insights`, {});
}
