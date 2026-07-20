import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(
    `${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/search${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
