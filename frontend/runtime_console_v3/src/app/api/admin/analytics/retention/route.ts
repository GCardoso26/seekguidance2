import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const days = req.nextUrl.searchParams.get("days") ?? "30";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/admin/analytics/retention?days=${encodeURIComponent(days)}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
