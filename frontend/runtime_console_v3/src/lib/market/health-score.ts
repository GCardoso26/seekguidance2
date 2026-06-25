import { createClient } from "@supabase/supabase-js";
import { getTopMovers } from "@/lib/market/top-movers";

export interface HealthScoreResult {
  game: string;
  score: number;
  status: "bullish" | "neutral" | "bearish";
  liquidity: number;
  priceStability: number;
  growth: number;
  sentiment: number;
  totalTransactions7d: number;
  avgPriceChange7d: number;
  newListings7d: number;
  activeBuyers7d: number;
  activeSellers7d: number;
  topGainers: import("@/lib/market/top-movers").TopMover[];
  topLosers: import("@/lib/market/top-movers").TopMover[];
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

export async function calculateHealthScore(game: string): Promise<HealthScoreResult> {
  const supabase = getSupabaseAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  if (!supabase) {
    return {
      game,
      score: 50,
      status: "neutral",
      liquidity: 0,
      priceStability: 50,
      growth: 0,
      sentiment: 50,
      totalTransactions7d: 0,
      avgPriceChange7d: 0,
      newListings7d: 0,
      activeBuyers7d: 0,
      activeSellers7d: 0,
      topGainers: [],
      topLosers: [],
    };
  }

  const { data: transactions } = await supabase
    .from("escrow_transactions")
    .select("amount_cents, buyer_id, seller_id")
    .eq("status", "released_to_seller")
    .gte("created_at", sevenDaysAgo);

  const totalTransactions7d = transactions?.length ?? 0;

  const gameCode = game.toUpperCase();
  const gameSlug = game.toLowerCase();

  const { data: recentPrices } = await supabase
    .from("card_prices")
    .select("price_cents, recorded_at, card_id")
    .gte("recorded_at", sevenDaysAgo)
    .limit(500);

  const { gainers, losers } = await getTopMovers(game, 5);
  const avgPriceChange7d =
    gainers.length + losers.length > 0
      ? [...gainers, ...losers].reduce((s, m) => s + m.changePct, 0) /
        (gainers.length + losers.length)
      : 0;

  void recentPrices;
  void gameCode;

  const { count: newListings7d } = await supabase
    .from("store_products")
    .select("*", { count: "exact", head: true })
    .eq("tcg_id", gameSlug)
    .gte("created_at", sevenDaysAgo);

  const { data: activeUsers } = await supabase
    .from("escrow_transactions")
    .select("buyer_id, seller_id")
    .gte("created_at", sevenDaysAgo);

  const uniqueBuyers = new Set(activeUsers?.map((u) => u.buyer_id)).size;
  const uniqueSellers = new Set(activeUsers?.map((u) => u.seller_id)).size;

  const liquidity = Math.min(100, (totalTransactions7d / 50) * 100);
  const priceStability = Math.max(0, 100 - Math.abs(avgPriceChange7d) * 10);
  const growth = Math.min(100, ((newListings7d ?? 0) / 100) * 100);
  const sentiment = avgPriceChange7d > 5 ? 80 : avgPriceChange7d < -5 ? 30 : 60;

  const score = Math.round(
    liquidity * 0.3 + priceStability * 0.25 + growth * 0.25 + sentiment * 0.2,
  );

  return {
    game,
    score,
    status: score > 70 ? "bullish" : score > 40 ? "neutral" : "bearish",
    liquidity,
    priceStability,
    growth,
    sentiment,
    totalTransactions7d,
    avgPriceChange7d,
    newListings7d: newListings7d ?? 0,
    activeBuyers7d: uniqueBuyers,
    activeSellers7d: uniqueSellers,
    topGainers: gainers,
    topLosers: losers,
  };
}

export async function persistHealthScore(result: HealthScoreResult): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("market_health_scores").upsert({
    game_code: result.game,
    score: result.score,
    status: result.status,
    metrics: {
      liquidity: result.liquidity,
      priceStability: result.priceStability,
      growth: result.growth,
      sentiment: result.sentiment,
      totalTransactions7d: result.totalTransactions7d,
      avgPriceChange7d: result.avgPriceChange7d,
      newListings7d: result.newListings7d,
      activeBuyers7d: result.activeBuyers7d,
      activeSellers7d: result.activeSellers7d,
      topGainers: result.topGainers,
      topLosers: result.topLosers,
    },
    computed_at: new Date().toISOString(),
  });
}
