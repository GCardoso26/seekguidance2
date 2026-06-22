import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ deckId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { deckId } = await context.params;
  const format = request.nextUrl.searchParams.get("format") ?? "text";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/decks/${deckId}/export?format=${encodeURIComponent(format)}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
