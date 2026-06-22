import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ gameSlug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { gameSlug } = await context.params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/formats/${encodeURIComponent(gameSlug)}`, {
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ formats: [] }, { status: 503 });
  }
}
