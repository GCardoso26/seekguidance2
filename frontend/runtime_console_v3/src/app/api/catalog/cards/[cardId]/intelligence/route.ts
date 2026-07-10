import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ cardId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { cardId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}/intelligence`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json({ error: "not_found" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
