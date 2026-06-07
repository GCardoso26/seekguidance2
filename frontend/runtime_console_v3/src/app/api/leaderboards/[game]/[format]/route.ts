import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ game: string; format: string }> },
) {
  const { game, format } = await params;
  const qs = req.nextUrl.search;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/leaderboards/${encodeURIComponent(game)}/${encodeURIComponent(format)}${qs}`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
