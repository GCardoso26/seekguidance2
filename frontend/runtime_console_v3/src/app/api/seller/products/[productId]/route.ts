import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ productId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { productId } = await ctx.params;
  try {
    const body = await req.text();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/products/${encodeURIComponent(productId)}`,
      {
        method: "PATCH",
        headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
        body,
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { productId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/products/${encodeURIComponent(productId)}`,
      { method: "DELETE", headers: await tournamentProxyHeaders() },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
