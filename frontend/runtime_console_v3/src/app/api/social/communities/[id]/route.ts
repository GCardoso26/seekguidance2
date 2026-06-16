import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/communities/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
