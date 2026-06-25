const TCG_API_BASE = "https://api.tcgapi.dev/v1";

export interface TcgApiCard {
  name?: string;
  market_price?: number;
  price?: number;
  price_change_7d?: string | number;
  set?: string;
}

export async function fetchTCGApiPrice(
  cardName: string,
  game = "mtg",
  set?: string,
): Promise<TcgApiCard | null> {
  const key = process.env.TCG_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({ q: cardName, game });
  if (set) params.set("set", set);

  try {
    const res = await fetch(`${TCG_API_BASE}/search?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: TcgApiCard[] };
    return data.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchTCGApiBulkPrices(
  cardNames: string[],
  game = "mtg",
): Promise<TcgApiCard[]> {
  const key = process.env.TCG_API_KEY;
  if (!key || cardNames.length === 0) return [];

  try {
    const res = await fetch(`${TCG_API_BASE}/bulk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cards: cardNames.map((name) => ({ name, game })) }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: TcgApiCard[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}
