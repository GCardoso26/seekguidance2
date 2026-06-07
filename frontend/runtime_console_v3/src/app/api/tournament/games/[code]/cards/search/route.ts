import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Params = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/tournament/games/${code}/cards/search?q=${encodeURIComponent(q)}`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
