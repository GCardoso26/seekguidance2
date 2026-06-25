import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ escrowId: string }> },
) {
  const { escrowId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/escrow/${encodeURIComponent(escrowId)}/confirm`,
      { method: "POST", headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
