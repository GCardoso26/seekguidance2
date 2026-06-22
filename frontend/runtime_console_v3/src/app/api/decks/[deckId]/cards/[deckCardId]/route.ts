import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ deckId: string; deckCardId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { deckId, deckCardId } = await context.params;
  try {
    const body = await request.text();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/cards/${deckCardId}`,
      {
        method: "PATCH",
        headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
        body,
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { deckId, deckCardId } = await context.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/cards/${deckCardId}`,
      {
        method: "DELETE",
        headers: await tournamentProxyHeaders(),
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
