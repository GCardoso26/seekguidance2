import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ deckId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { deckId } = await context.params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/publish`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
