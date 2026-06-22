import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ deckId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { deckId } = await context.params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/validate`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Validação indisponível" }, { status: 503 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { deckId } = await context.params;
  try {
    const body = await request.text();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/validate`, {
      method: "POST",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Validação indisponível" }, { status: 503 });
  }
}
