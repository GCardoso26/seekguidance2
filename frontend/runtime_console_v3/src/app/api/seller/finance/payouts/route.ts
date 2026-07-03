import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerFinancePayoutsMock } from "@/lib/seller-finance-mock";
import { useSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET() {
  if (useSellerCiMocks()) {
    return NextResponse.json(sellerFinancePayoutsMock());
  }
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/finance/payouts`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerFinancePayoutsMock());
  }
}
