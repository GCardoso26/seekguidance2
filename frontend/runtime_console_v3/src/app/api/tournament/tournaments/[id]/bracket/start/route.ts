import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

/** Inicia torneio (swiss) ou top cut — proxy para actions existentes no FastAPI. */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { mode?: string };
  const action = body.mode === "tournament" ? "start" : "advance-top-cut";

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments/${id}/${action}`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
