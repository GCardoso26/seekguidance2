import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ username: string }> };

const EMPTY_REVIEWS = {
  reviews: [],
  total: 0,
  page: 1,
  limit: 10,
  rating_summary: { average: 0, total: 0, distribution: {} },
};

export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const { searchParams } = request.nextUrl;

  try {
    const headers = await tournamentProxyHeaders(request);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/sellers/${encodeURIComponent(username)}/reviews?${searchParams}`,
      { headers, next: { revalidate: 120 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(EMPTY_REVIEWS);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const body = await request.json();

  try {
    const headers = await tournamentProxyHeaders(request);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/sellers/${encodeURIComponent(username)}/reviews`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Serviço indisponível" }, { status: 503 });
  }
}
