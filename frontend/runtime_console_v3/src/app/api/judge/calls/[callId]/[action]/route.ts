import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

const BASE = `${TOURNAMENT_API_BASE}/runtime/judge/judge`;

type Params = { params: Promise<{ callId: string; action: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { callId, action } = await params;
  const allowed = new Set(["accept", "resolve", "escalate"]);
  if (!allowed.has(action)) {
    return NextResponse.json({ detail: "Ação inválida" }, { status: 404 });
  }

  try {
    const body = action === "accept" ? undefined : await _req.text();
    const res = await fetch(`${BASE}/calls/${callId}/${action}`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body: body && body.length > 0 ? body : undefined,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
