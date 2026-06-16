import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ postId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { postId } = await ctx.params;
  const body = await req.text();
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/social/posts/${encodeURIComponent(postId)}/vote`,
      { method: "POST", headers: await tournamentProxyHeaders(), body, cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
