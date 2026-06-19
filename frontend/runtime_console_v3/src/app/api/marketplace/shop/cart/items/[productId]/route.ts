import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  const { productId } = await ctx.params;
  try {
    const body = await req.text();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/cart/items/${encodeURIComponent(productId)}`,
      {
        method: "PUT",
        headers: await tournamentProxyHeaders(),
        body,
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  const { productId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/cart/items/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        headers: await tournamentProxyHeaders(),
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
