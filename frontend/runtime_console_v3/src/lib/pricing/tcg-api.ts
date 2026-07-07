/**
 * Provider oficial tcgapi.dev — única integração HTTP de preços no frontend.
 * Chave: process.env.TCG_API_KEY (nunca hardcode).
 */
const TCG_API_BASE = "https://api.tcgapi.dev/v1";

export interface TcgApiCard {
  name?: string;
  market_price?: number;
  price?: number;
  price_change_7d?: string | number;
  set?: string;
}

function authHeaders(key: string): HeadersInit {
  return {
    Authorization: `Bearer ${key}`,
    "X-API-Key": key,
  };
}

export class TcgApiProvider {
  private readonly apiKey: string | undefined;

  constructor(apiKey = process.env.TCG_API_KEY) {
    this.apiKey = apiKey?.trim() || undefined;
  }

  get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async searchPrice(cardName: string, game = "mtg", set?: string): Promise<TcgApiCard | null> {
    if (!this.apiKey) return null;

    const params = new URLSearchParams({ q: cardName, game });
    if (set) params.set("set", set);

    try {
      const res = await fetch(`${TCG_API_BASE}/search?${params}`, {
        headers: authHeaders(this.apiKey),
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { data?: TcgApiCard[] };
      return data.data?.[0] ?? null;
    } catch {
      return null;
    }
  }

  async bulkPrices(cardNames: string[], game = "mtg"): Promise<TcgApiCard[]> {
    if (!this.apiKey || cardNames.length === 0) return [];

    try {
      const res = await fetch(`${TCG_API_BASE}/bulk`, {
        method: "POST",
        headers: { ...authHeaders(this.apiKey), "Content-Type": "application/json" },
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
}

const defaultProvider = new TcgApiProvider();

/** @deprecated Use TcgApiProvider — mantido para contratos existentes. */
export async function fetchTCGApiPrice(
  cardName: string,
  game = "mtg",
  set?: string,
): Promise<TcgApiCard | null> {
  return defaultProvider.searchPrice(cardName, game, set);
}

/** @deprecated Use TcgApiProvider — mantido para contratos existentes. */
export async function fetchTCGApiBulkPrices(
  cardNames: string[],
  game = "mtg",
): Promise<TcgApiCard[]> {
  return defaultProvider.bulkPrices(cardNames, game);
}
