import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { deckShopMock } from "@/lib/buyer-experience-mock";

type Ctx = { params: Promise<{ deckId: string }> };

export async function GET(req: NextRequest, context: Ctx) {
  const { deckId } = await context.params;
  const mode = req.nextUrl.searchParams.get("mode") ?? "missing";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/buyer/decks/${encodeURIComponent(deckId)}/shop?mode=${encodeURIComponent(mode)}`,
      {
        headers: await tournamentProxyHeaders(req),
        cache: "no-store",
      },
    );
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return NextResponse.json(deckShopMock(deckId, mode));
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(deckShopMock(deckId, mode));
  }
}
