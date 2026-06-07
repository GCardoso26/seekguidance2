import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string; roundNumber: string; action: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id, roundNumber, action } = await params;
  const body = await req.text();
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/tournaments/${id}/rounds/${roundNumber}/${action}`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(),
        body: body || undefined,
        cache: "no-store",
      },
    );
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
