import { createClient } from "@supabase/supabase-js";
import { fetchCardmarketPrice } from "@/lib/pricing/cardmarket-api";
import { convertEURtoBRL, convertUSDtoBRL } from "@/lib/pricing/exchange-rates";
import { fetchTCGApiPrice } from "@/lib/pricing/tcg-api";
import { getCachedJson, setCachedJson } from "@/lib/redis";

const WEIGHTS = { tcgplayer: 0.4, cardmarket: 0.3, local: 0.3 } as const;

const CONDITION_MULTIPLIER: Record<string, number> = {
  NM: 1,
  LP: 0.85,
  MP: 0.7,
  HP: 0.5,
  DM: 0.3,
};

export interface LocalMarketData {
  averagePrice: number;
  listingsCount: number;
}

export interface ValuationFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  description: string;
  weight: number;
}

export interface ValuationResult {
  cardName: string;
  condition: string;
  ourPriceCents: number;
  confidence: "high" | "medium" | "low";
  explanation: {
    summary: string;
    factors: ValuationFactor[];
    trendAnalysis: {
      direction: "up" | "down" | "stable";
      percentage: number;
      period: string;
      reasoning: string;
    };
  };
  marketData: {
    tcgplayer: Awaited<ReturnType<typeof fetchTCGApiPrice>>;
    cardmarket: Awaited<ReturnType<typeof fetchCardmarketPrice>>;
    local: LocalMarketData | null;
  };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

async function fetchLocalMarketData(cardName: string, _condition: string): Promise<LocalMarketData | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: cards } = await supabase
    .from("card_catalog")
    .select("id")
    .ilike("name", cardName)
    .limit(1);

  const card = cards?.[0];
  if (!card) return null;

  const { data: listings } = await supabase
    .from("card_listings")
    .select("price_cents")
    .eq("card_id", card.id)
    .eq("status", "active");

  if (!listings?.length) {
    return { averagePrice: 0, listingsCount: 0 };
  }

  const averagePrice = Math.round(
    listings.reduce((sum, row) => sum + row.price_cents, 0) / listings.length,
  );

  return {
    averagePrice,
    listingsCount: listings.length,
  };
}

function calculateConfidence(
  tcg: unknown,
  cm: unknown,
  local: LocalMarketData | null,
): "high" | "medium" | "low" {
  const sources = [tcg, cm, local?.averagePrice].filter(Boolean).length;
  if (sources >= 3) return "high";
  if (sources === 2) return "medium";
  return "low";
}

function generateExplanation(params: {
  tcgData: Awaited<ReturnType<typeof fetchTCGApiPrice>>;
  cardmarketData: Awaited<ReturnType<typeof fetchCardmarketPrice>>;
  localData: LocalMarketData | null;
  fairPrice: number;
  condition: string;
}): ValuationResult["explanation"] {
  const { tcgData, cardmarketData, localData, condition } = params;
  const trend7d = tcgData?.price_change_7d ? parseFloat(String(tcgData.price_change_7d)) : 0;
  const conditionMultiplier = CONDITION_MULTIPLIER[condition] ?? 1;
  const sourceCount = [tcgData, cardmarketData, localData].filter(Boolean).length;

  return {
    summary:
      `Preço calculado a partir de ${sourceCount} fonte(s). ` +
      `Tendência de ${trend7d > 0 ? "alta" : "baixa"} de ${Math.abs(trend7d).toFixed(1)}% em 7 dias.`,
    factors: [
      {
        name: "Preço TCGPlayer (US)",
        impact: trend7d > 5 ? "positive" : trend7d < -5 ? "negative" : "neutral",
        description: tcgData
          ? `Preço médio nos EUA: $${tcgData.market_price ?? tcgData.price} (${trend7d}% em 7d)`
          : "Dados indisponíveis",
        weight: WEIGHTS.tcgplayer,
      },
      {
        name: "Preço Cardmarket (EU)",
        impact: "neutral",
        description: cardmarketData?.prices?.cardmarket?.lowest_near_mint
          ? `Menor preço NM na Europa: €${cardmarketData.prices.cardmarket.lowest_near_mint}`
          : "Dados indisponíveis",
        weight: WEIGHTS.cardmarket,
      },
      {
        name: "Mercado Brasileiro",
        impact: "neutral",
        description: localData
          ? `Preço médio local: R$ ${(localData.averagePrice / 100).toFixed(2)} (${localData.listingsCount} listagens)`
          : "Sem listagens locais",
        weight: WEIGHTS.local,
      },
      {
        name: "Condição",
        impact: conditionMultiplier >= 1 ? "positive" : "negative",
        description: `Condição ${condition}: ${(conditionMultiplier * 100).toFixed(0)}% do preço NM`,
        weight: 0.1,
      },
    ],
    trendAnalysis: {
      direction: trend7d > 2 ? "up" : trend7d < -2 ? "down" : "stable",
      percentage: Math.abs(trend7d),
      period: "7 dias",
      reasoning:
        trend7d > 5
          ? "Alta demanda recente, possível especulação ou novo deck meta."
          : trend7d < -5
            ? "Queda de demanda, possível reprint ou saída do formato."
            : "Preço estável, liquidez consistente.",
    },
  };
}

export async function calculateValuation(
  cardName: string,
  condition = "NM",
  game = "mtg",
): Promise<ValuationResult> {
  const cacheKey = `valuation:${game}:${cardName}:${condition}`;
  const cached = await getCachedJson<ValuationResult>(cacheKey);
  if (cached) return cached;

  const [tcgData, cardmarketData, localData] = await Promise.all([
    fetchTCGApiPrice(cardName, game),
    fetchCardmarketPrice(cardName, game),
    fetchLocalMarketData(cardName, condition),
  ]);

  const tcgPriceBRL = tcgData
    ? await convertUSDtoBRL(Number(tcgData.market_price ?? tcgData.price ?? 0))
    : null;
  const cmPriceBRL = cardmarketData?.prices?.cardmarket?.lowest_near_mint
    ? await convertEURtoBRL(cardmarketData.prices.cardmarket.lowest_near_mint)
    : null;

  let weightedPrice = 0;
  let totalWeight = 0;

  if (tcgPriceBRL) {
    weightedPrice += tcgPriceBRL * WEIGHTS.tcgplayer;
    totalWeight += WEIGHTS.tcgplayer;
  }
  if (cmPriceBRL) {
    weightedPrice += cmPriceBRL * WEIGHTS.cardmarket;
    totalWeight += WEIGHTS.cardmarket;
  }
  if (localData?.averagePrice) {
    weightedPrice += localData.averagePrice * WEIGHTS.local;
    totalWeight += WEIGHTS.local;
  }

  const conditionMultiplier = CONDITION_MULTIPLIER[condition] ?? 1;
  const fairPrice =
    totalWeight > 0 ? Math.round((weightedPrice / totalWeight) * conditionMultiplier) : localData?.averagePrice ?? 0;

  const result: ValuationResult = {
    cardName,
    condition,
    ourPriceCents: fairPrice,
    confidence: calculateConfidence(tcgData, cardmarketData, localData),
    marketData: { tcgplayer: tcgData, cardmarket: cardmarketData, local: localData },
    explanation: generateExplanation({ tcgData, cardmarketData, localData, fairPrice, condition }),
  };

  await setCachedJson(cacheKey, result, 3600);
  return result;
}
