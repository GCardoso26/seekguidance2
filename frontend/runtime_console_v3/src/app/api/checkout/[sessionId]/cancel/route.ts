import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { sessionId } = await params;
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/checkout/${encodeURIComponent(sessionId)}/cancel`,
      { method: "POST", headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Falha ao cancelar checkout" }, { status: 503 });
  }
}
