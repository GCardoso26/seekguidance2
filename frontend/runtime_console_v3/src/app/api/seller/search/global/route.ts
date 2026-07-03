import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerGlobalSearchMock } from "@/lib/seller-global-search-mock";
import { useSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ query: q, categories: {}, total: 0 });
  }
  if (useSellerCiMocks()) {
    return NextResponse.json(sellerGlobalSearchMock(q));
  }
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/search/global?q=${encodeURIComponent(q)}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerGlobalSearchMock(q));
  }
}
