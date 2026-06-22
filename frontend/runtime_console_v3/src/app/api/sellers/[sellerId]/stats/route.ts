import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Params = { params: Promise<{ sellerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { sellerId } = await params;
    const qs = req.nextUrl.searchParams.toString();
    const url = `${TOURNAMENT_API_BASE}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/stats${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ stats: null }, { status: 503 });
  }
}
