import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ deckId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { deckId } = await context.params;
  try {
    const body = await request.text();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/cards`, {
      method: "POST",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
