import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ orderId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { orderId } = await ctx.params;
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/orders/${encodeURIComponent(orderId)}/confirm-counter`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(req),
        body: "{}",
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}