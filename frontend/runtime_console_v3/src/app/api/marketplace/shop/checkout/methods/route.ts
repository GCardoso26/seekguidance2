import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/checkout/methods`, {
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
