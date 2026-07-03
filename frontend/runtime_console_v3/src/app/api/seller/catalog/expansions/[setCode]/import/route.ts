import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ setCode: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { setCode } = await ctx.params;
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/catalog/expansions/${encodeURIComponent(setCode)}/import${qs ? `?${qs}` : ""}`,
      { method: "POST", headers: await tournamentProxyHeaders() },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ created: 0, skipped: 0, set_code: setCode });
  }
}
