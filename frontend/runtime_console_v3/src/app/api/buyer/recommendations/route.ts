import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { buyerRecommendationsMock } from "@/lib/buyer-experience-mock";

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit") ?? "12";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/buyer/recommendations?limit=${encodeURIComponent(limit)}`,
      {
        headers: await tournamentProxyHeaders(req),
        cache: "no-store",
      },
    );
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return NextResponse.json(buyerRecommendationsMock());
    }
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(buyerRecommendationsMock());
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(buyerRecommendationsMock());
  }
}
