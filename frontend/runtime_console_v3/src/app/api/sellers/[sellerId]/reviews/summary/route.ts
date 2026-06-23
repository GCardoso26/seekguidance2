import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/reviews/summary`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
