import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerFinanceRevenueMock } from "@/lib/seller-finance-mock";

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/finance/revenue${qs ? `?${qs}` : ""}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerFinanceRevenueMock());
  }
}
