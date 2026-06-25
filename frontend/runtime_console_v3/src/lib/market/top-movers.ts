import { createClient } from "@supabase/supabase-js";

export interface TopMover {
  cardId: string;
  name: string;
  changePct: number;
  currentPriceCents: number;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

/** Cartas com maior variação de preço em 7 dias (via card_prices). */
export async function getTopMovers(
  game: string,
  limit = 5,
): Promise<{ gainers: TopMover[]; losers: TopMover[] }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { gainers: [], losers: [] };

  const gameCode = game.toUpperCase();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: cards } = await supabase
    .from("card_catalog")
    .select("id, name")
    .eq("game_code", gameCode)
    .limit(200);

  if (!cards?.length) return { gainers: [], losers: [] };

  const movers: TopMover[] = [];

  for (const card of cards) {
    const { data: recent } = await supabase
      .from("card_prices")
      .select("price_cents")
      .eq("card_id", card.id)
      .order("recorded_at", { ascending: false })
      .limit(1);

    const { data: old } = await supabase
      .from("card_prices")
      .select("price_cents")
      .eq("card_id", card.id)
      .lte("recorded_at", weekAgo)
      .order("recorded_at", { ascending: false })
      .limit(1);

    const current = recent?.[0]?.price_cents;
    const previous = old?.[0]?.price_cents;
    if (!current || !previous || previous <= 0) continue;

    const changePct = ((current - previous) / previous) * 100;
    if (Math.abs(changePct) < 1) continue;

    movers.push({
      cardId: card.id,
      name: card.name,
      changePct,
      currentPriceCents: current,
    });
  }

  movers.sort((a, b) => b.changePct - a.changePct);
  return {
    gainers: movers.filter((m) => m.changePct > 0).slice(0, limit),
    losers: [...movers].filter((m) => m.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, limit),
  };
}
