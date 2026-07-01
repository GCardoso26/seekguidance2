import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerProfileMock } from "@/lib/seller-profile-mock";

type Params = { params: Promise<{ username: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;

  try {
    const headers = await tournamentProxyHeaders(request);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/sellers/${encodeURIComponent(username)}`,
      { headers, next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    try {
      return NextResponse.json(sellerProfileMock.getProfile(username));
    } catch {
      return NextResponse.json({ error: "seller_not_found" }, { status: 404 });
    }
  }
}
