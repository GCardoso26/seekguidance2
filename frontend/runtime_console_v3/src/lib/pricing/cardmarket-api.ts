const CARDMARKET_API_BASE = "https://www.cardmarket-api.com";

export interface CardmarketCard {
  name?: string;
  prices?: {
    cardmarket?: {
      lowest_near_mint?: number;
    };
  };
}

export async function fetchCardmarketPrice(cardName: string, game = "mtg"): Promise<CardmarketCard | null> {
  const key = process.env.CARDMARKET_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `${CARDMARKET_API_BASE}/${game}/cards?search=${encodeURIComponent(cardName)}&sort=price_lowest`,
      { headers: { "X-API-Key": key }, next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: CardmarketCard[] };
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}
