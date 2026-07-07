import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerAiInsightsMock } from "@/lib/seller-ai-mock";
import { preferSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET() {
  if (preferSellerCiMocks()) {
    return NextResponse.json(sellerAiInsightsMock());
  }
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/ai/insights`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerAiInsightsMock());
  }
}
