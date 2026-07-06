import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerFinanceChargebacksMock } from "@/lib/seller-finance-mock";
import { preferSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET(request: Request) {
  if (preferSellerCiMocks()) {
    return NextResponse.json(sellerFinanceChargebacksMock());
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/finance/chargebacks${qs}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerFinanceChargebacksMock());
  }
}
