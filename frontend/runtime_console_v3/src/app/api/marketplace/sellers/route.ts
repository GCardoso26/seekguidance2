import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerProfileMock } from "@/lib/seller-profile-mock";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const headers = await tournamentProxyHeaders(request);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/sellers?${searchParams}`,
      { headers, next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerProfileMock.listSellers(searchParams));
  }
}
