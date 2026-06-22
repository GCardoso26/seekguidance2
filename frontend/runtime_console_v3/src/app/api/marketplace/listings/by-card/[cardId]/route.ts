import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteParams = { params: Promise<{ cardId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { cardId } = await params;
  const incoming = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  const condition = incoming.get("condition");
  const foil = incoming.get("foil");
  if (condition) query.set("condition", condition);
  if (foil !== null && foil !== "") query.set("foil", foil);

  const qs = query.toString();
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/listings/by-card/${encodeURIComponent(cardId)}${qs ? `?${qs}` : ""}`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ listings: [] }, { status: 503 });
  }
}
