import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerProfileMock } from "@/lib/seller-profile-mock";

type Params = { params: Promise<{ username: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const { searchParams } = request.nextUrl;

  try {
    const headers = await tournamentProxyHeaders(request);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/sellers/${encodeURIComponent(username)}/products?${searchParams}`,
      { headers, next: { revalidate: 30 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    try {
      sellerProfileMock.getProfile(username);
      return NextResponse.json(sellerProfileMock.getProducts(username, searchParams));
    } catch {
      return NextResponse.json({ error: "seller_not_found" }, { status: 404 });
    }
  }
}
