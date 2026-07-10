import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { buyerInsightsMock } from "@/lib/buyer-experience-mock";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/buyer/ai/insights`, {
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return NextResponse.json(buyerInsightsMock());
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(buyerInsightsMock());
  }
}
