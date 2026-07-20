import type { AggregatedValuation, PriceQuoteDTO, PricingMarketCode } from "../domain/types.js";

function median(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid];
}

/** Pesos por mercado (BRL-normalized quotes). */
const MARKET_WEIGHT: Partial<Record<PricingMarketCode, number>> = {
  JUDGETCG: 0.35,
  TCGPLAYER: 0.25,
  CARDMARKET: 0.2,
  CARDTRADER: 0.15,
  EBAY: 0.05,
};

/**
 * Agrega quotes de múltiplos mercados → valuation canônica.
 */
export function aggregateQuotes(
  subjectType: AggregatedValuation["subjectType"],
  subjectId: string,
  currency: string,
  quotes: PriceQuoteDTO[],
): AggregatedValuation {
  const mins = quotes.map((q) => q.minPriceCents).filter((n): n is number => n != null && n > 0);
  const avgs = quotes.map((q) => q.avgPriceCents).filter((n): n is number => n != null && n > 0);
  const medians = quotes
    .map((q) => q.medianPriceCents ?? q.avgPriceCents)
    .filter((n): n is number => n != null && n > 0);

  let weighted = 0;
  let weightSum = 0;
  for (const q of quotes) {
    const price = q.suggestedPriceCents ?? q.medianPriceCents ?? q.avgPriceCents ?? q.minPriceCents;
    if (price == null || price <= 0) continue;
    const w = MARKET_WEIGHT[q.marketCode] ?? 0.1;
    weighted += price * w;
    weightSum += w;
  }

  const minPriceCents = mins.length ? Math.min(...mins) : undefined;
  const avgPriceCents = avgs.length
    ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
    : undefined;
  const medianPriceCents = median(medians);
  const suggestedPriceCents =
    weightSum > 0 ? Math.round(weighted / weightSum) : medianPriceCents ?? avgPriceCents;

  const maxOfMins = mins.length ? Math.max(...mins) : undefined;
  const spreadBps =
    minPriceCents && maxOfMins && minPriceCents > 0
      ? Math.round(((maxOfMins - minPriceCents) / minPriceCents) * 10_000)
      : undefined;

  const liquidityScores = quotes
    .map((q) => q.liquidityScore)
    .filter((n): n is number => n != null);
  const liquidityScore = liquidityScores.length
    ? liquidityScores.reduce((a, b) => a + b, 0) / liquidityScores.length
    : quotes.reduce((a, q) => a + (q.sellerCount ?? 0), 0) / Math.max(quotes.length, 1);

  const confidence: AggregatedValuation["confidence"] =
    quotes.length >= 3 ? "high" : quotes.length === 2 ? "medium" : "low";

  return {
    subjectType,
    subjectId,
    currency,
    minPriceCents,
    avgPriceCents,
    medianPriceCents,
    suggestedPriceCents,
    spreadBps,
    liquidityScore: Number(liquidityScore.toFixed(4)),
    confidence,
    sources: quotes.map((q) => q.marketCode),
    computedAt: new Date().toISOString(),
  };
}
