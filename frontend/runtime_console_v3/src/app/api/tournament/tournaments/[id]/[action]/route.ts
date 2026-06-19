import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string; action: string }> };

const POST_ACTIONS = new Set([
  "start-check-in",
  "start",
  "rounds",
  "advance-top-cut",
  "finalize",
  "register",
]);

export async function POST(req: NextRequest, { params }: Params) {
  const { id, action } = await params;
  if (!POST_ACTIONS.has(action)) {
    return NextResponse.json({ detail: "Ação inválida" }, { status: 404 });
  }
  const body = await req.text();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments/${id}/${action}`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body: body || undefined,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
