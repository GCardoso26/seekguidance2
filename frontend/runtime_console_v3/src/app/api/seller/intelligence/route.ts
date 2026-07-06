import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerIntelligenceMock } from "@/lib/seller-intelligence-mock";
import { preferSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET(request: Request) {
  if (preferSellerCiMocks()) {
    return NextResponse.json(sellerIntelligenceMock());
  }
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/intelligence?period=${period}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerIntelligenceMock());
  }
}
