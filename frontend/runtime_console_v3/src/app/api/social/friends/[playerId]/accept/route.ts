import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(_req: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/social/friends/${encodeURIComponent(playerId)}/accept`,
      { method: "POST", headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
