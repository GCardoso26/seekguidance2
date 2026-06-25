import { getCachedJson, setCachedJson } from "@/lib/redis";

const RATE_TTL = 3600;

async function fetchRateFromApi(from: string, to: string): Promise<number | null> {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    if (from === "USD" && to === "BRL") return 5.0;
    if (from === "EUR" && to === "BRL") return 5.5;
    return null;
  }

  try {
    const res = await fetch(
      `https://api.exchangerate.host/convert?from=${from}&to=${to}&access_key=${key}`,
      { next: { revalidate: RATE_TTL } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: number };
    return data.result ?? null;
  } catch {
    return null;
  }
}

export async function getExchangeRate(from: string, to: string): Promise<number> {
  const cacheKey = `fx:${from}:${to}`;
  const cached = await getCachedJson<number>(cacheKey);
  if (cached) return cached;

  const rate = (await fetchRateFromApi(from, to)) ?? (from === "USD" ? 5.0 : 5.5);
  await setCachedJson(cacheKey, rate, RATE_TTL);
  return rate;
}

export async function convertUSDtoBRL(usdAmount: number): Promise<number> {
  const rate = await getExchangeRate("USD", "BRL");
  return Math.round(usdAmount * rate * 100);
}

export async function convertEURtoBRL(eurAmount: number): Promise<number> {
  const rate = await getExchangeRate("EUR", "BRL");
  return Math.round(eurAmount * rate * 100);
}
