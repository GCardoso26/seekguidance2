import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerAnalyticsMock } from "@/lib/seller-analytics-mock";

type Params = { params: Promise<{ username: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;

  try {
    const headers = await tournamentProxyHeaders(request);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/sellers/${encodeURIComponent(username)}/analytics`,
      { headers, next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerAnalyticsMock(username));
  }
}
