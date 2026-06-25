import { NextRequest, NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron/auth";
import { fetchTCGApiBulkPrices } from "@/lib/pricing/tcg-api";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

export async function GET(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }

  const game = req.nextUrl.searchParams.get("game") ?? "mtg";
  const { data: cards } = await supabase
    .from("card_catalog")
    .select("id, name")
    .eq("game_code", game.toUpperCase())
    .order("created_at", { ascending: false })
    .limit(50);

  const names = (cards ?? []).map((c) => c.name);
  const prices = await fetchTCGApiBulkPrices(names, game);
  let upserted = 0;

  for (const row of prices) {
    const card = cards?.find((c) => c.name === row.name);
    if (!card) continue;
    const cents = Math.round(Number(row.market_price ?? row.price ?? 0) * 100);
    if (cents <= 0) continue;

    const { error } = await supabase.from("card_prices").insert({
      card_id: card.id,
      source: "tcgapi",
      currency: "USD",
      price_cents: cents,
    });
    if (!error) upserted += 1;
  }

  return NextResponse.json({
    ok: true,
    game,
    fetched: prices.length,
    upserted,
    tcgApiConfigured: Boolean(process.env.TCG_API_KEY),
    renderSync: await syncViaRenderApi(game).catch(() => null),
  });
}

async function syncViaRenderApi(game: string) {
  const base = process.env.TOURNAMENT_API_URL ?? process.env.NEXT_PUBLIC_TOURNAMENT_API_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return null;
  const res = await fetch(
    `${base.replace(/\/$/, "")}/runtime/judge/catalog/cron/sync-tcgapi-prices?game=${encodeURIComponent(game)}&limit=50`,
    { method: "POST", headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
  );
  if (!res.ok) return { ok: false, status: res.status };
  return res.json();
}
