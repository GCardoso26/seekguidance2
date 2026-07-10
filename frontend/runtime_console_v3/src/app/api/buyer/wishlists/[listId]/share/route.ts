import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ listId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { listId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/buyer/wishlists/${encodeURIComponent(listId)}/share`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(req),
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Backend indisponível" }, { status: 503 });
  }
}
