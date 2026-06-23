import { NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

type RawGame = Record<string, unknown>;

function normalizeGame(row: RawGame) {
  const slug = String(row.slug ?? row.game_slug ?? row.tcg_id ?? "");
  return {
    id: String(row.id ?? slug),
    game_code: String(row.game_code ?? row.tcg_id ?? slug).toUpperCase(),
    slug,
    name: String(row.name ?? row.display_name ?? slug),
    display_name: String(row.display_name ?? row.name ?? slug),
    description: row.description ?? null,
    logo_url: row.logo_url ?? null,
    banner_url: row.banner_url ?? null,
    is_active: row.is_active ?? row.enabled ?? true,
    api_source: row.api_source ?? null,
    card_count: Number(row.card_count ?? row.chunk_count ?? 0),
    last_sync_at: (row.last_sync_at ?? row.last_indexed_at ?? null) as string | null,
    sort_order: Number(row.sort_order ?? 0),
  };
}

export async function GET() {
  try {
    let res = await fetch(`${API_BASE}/runtime/judge/catalog/games`, { cache: "no-store" });
    if (!res.ok) {
      res = await fetch(`${API_BASE}/runtime/judge/games`, { cache: "no-store" });
    }
    const data = await res.json();
    const games = ((data.games ?? []) as RawGame[]).map(normalizeGame).filter((g) => g.slug);
    return NextResponse.json({ games }, { status: res.ok || games.length ? 200 : res.status });
  } catch {
    return NextResponse.json({ games: [] }, { status: 503 });
  }
}
