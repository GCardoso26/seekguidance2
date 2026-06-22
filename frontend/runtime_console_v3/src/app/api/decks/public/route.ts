import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get("game");
  const limit = request.nextUrl.searchParams.get("limit");
  const params = new URLSearchParams();
  if (game) params.set("game", game);
  if (limit) params.set("limit", limit);
  const qs = params.toString() ? `?${params}` : "";
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/decks/public${qs}`, {
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
