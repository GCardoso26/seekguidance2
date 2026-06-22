import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { itemId } = await context.params;
  try {
    const body = await request.text();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/user/collection/${itemId}`, {
      method: "PATCH",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Coleção indisponível" }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { itemId } = await context.params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/user/collection/${itemId}`, {
      method: "DELETE",
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Coleção indisponível" }, { status: 503 });
  }
}
