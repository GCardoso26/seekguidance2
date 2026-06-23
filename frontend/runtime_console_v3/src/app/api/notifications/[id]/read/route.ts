import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const source = request.nextUrl.searchParams.get("source") || "social";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/notifications/${id}/read?source=${encodeURIComponent(source)}`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(),
        cache: "no-store",
      },
    );
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
