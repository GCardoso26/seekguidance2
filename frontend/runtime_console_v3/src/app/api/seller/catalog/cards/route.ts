import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { catalogCardsMock } from "@/lib/seller-catalog-mock";

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/catalog/cards${qs ? `?${qs}` : ""}`,
      { headers: await tournamentProxyHeaders(), next: { revalidate: 30 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    const game = req.nextUrl.searchParams.get("game") ?? "mtg";
    return NextResponse.json(catalogCardsMock(game));
  }
}
