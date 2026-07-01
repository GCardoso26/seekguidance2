import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { getStaticSyntaxValues } from "@/lib/syntax-values-static";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const field = searchParams.get("field");
  const game = searchParams.get("game") || "mtg";
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);

  if (!field) {
    return NextResponse.json({ error: "field required" }, { status: 400 });
  }

  try {
    const headers = await tournamentProxyHeaders(request);
    const params = new URLSearchParams({ field, game, q, limit: String(limit) });
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/search/syntax-values?${params}`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(getStaticSyntaxValues(field, game, q, limit));
  }
}
