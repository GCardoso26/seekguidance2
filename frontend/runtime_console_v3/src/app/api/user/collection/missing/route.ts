import { NextRequest, NextResponse } from "next/server";
import { API_PROXY_BASE } from "@/lib/api-proxy-base";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import type { CollectionItem } from "@/hooks/useDeck";

export const dynamic = "force-dynamic";

type SearchCard = {
  id?: string;
  name?: string;
  set_code?: string;
  set?: { code?: string };
  lowestPrice?: number | null;
  latestPrice?: { price?: number; currency?: string } | null;
  image_uris?: Record<string, string>;
  imageUris?: Record<string, string>;
};

/**
 * Cartas faltantes de um set: Catalog search − Collection owned (APIs públicas).
 */
export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get("game");
  const set = request.nextUrl.searchParams.get("set");
  if (!game || !set) {
    return NextResponse.json({ detail: "game_and_set_required" }, { status: 400 });
  }

  try {
    const headers = await tournamentProxyHeaders(request);
    const colRes = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/user/collection`, {
      headers,
      cache: "no-store",
    });
    if (colRes.status === 401) {
      return NextResponse.json({ detail: "login_required" }, { status: 401 });
    }
    if (!colRes.ok) {
      return NextResponse.json({ detail: "collection_unavailable" }, { status: colRes.status });
    }
    const colJson = (await colRes.json()) as { items?: CollectionItem[] };
    const owned = new Set((colJson.items ?? []).map((i) => i.card_id));

    const params = new URLSearchParams();
    params.set("game", game);
    params.set("set", set);
    params.set("limit", "250");
    const searchRes = await fetch(
      `${API_PROXY_BASE}/runtime/judge/catalog/cards/search?${params}`,
      { next: { revalidate: 600 } },
    );
    if (!searchRes.ok) {
      return NextResponse.json({ detail: "catalog_search_failed" }, { status: searchRes.status });
    }
    const searchJson = await searchRes.json();
    const cards: SearchCard[] =
      searchJson.cards ?? searchJson.items ?? searchJson.results ?? [];

    const missing = cards
      .filter((c) => c.id && !owned.has(String(c.id)))
      .map((c) => {
        const price =
          c.lowestPrice ?? c.latestPrice?.price ?? null;
        return {
          id: String(c.id),
          name: c.name ?? "Carta",
          setCode: c.set_code || c.set?.code || set,
          unitPrice: typeof price === "number" ? price : null,
          currency: c.latestPrice?.currency || "BRL",
          imageUrl: c.image_uris?.small || c.imageUris?.small || c.image_uris?.normal || null,
        };
      });

    const priced = missing.filter((m) => m.unitPrice != null);
    const minPrice =
      priced.length > 0 ? Math.min(...priced.map((m) => m.unitPrice as number)) : null;
    const avgPrice =
      priced.length > 0
        ? priced.reduce((s, m) => s + (m.unitPrice as number), 0) / priced.length
        : null;
    const sumPrice =
      priced.length > 0 ? priced.reduce((s, m) => s + (m.unitPrice as number), 0) : null;

    return NextResponse.json({
      game,
      set,
      missingCount: missing.length,
      minPrice,
      avgPrice,
      sumPrice,
      currency: "BRL",
      missing,
    });
  } catch {
    return NextResponse.json({ detail: "missing_unavailable" }, { status: 503 });
  }
}
