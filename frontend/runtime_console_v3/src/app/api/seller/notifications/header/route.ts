import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerHeaderNotificationsMock } from "@/lib/seller-global-search-mock";
import { preferSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET() {
  if (preferSellerCiMocks()) {
    return NextResponse.json(sellerHeaderNotificationsMock());
  }
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/notifications/header`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerHeaderNotificationsMock());
  }
}
