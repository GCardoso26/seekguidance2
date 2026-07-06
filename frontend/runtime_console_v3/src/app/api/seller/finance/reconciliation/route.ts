import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerFinanceReconciliationMock } from "@/lib/seller-finance-mock";
import { preferSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET(request: Request) {
  if (preferSellerCiMocks()) {
    return NextResponse.json(sellerFinanceReconciliationMock());
  }
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "100";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/finance/reconciliation?limit=${limit}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerFinanceReconciliationMock());
  }
}
