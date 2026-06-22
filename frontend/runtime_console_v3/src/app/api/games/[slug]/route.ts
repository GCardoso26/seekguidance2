import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

const API_BASE = (process.env.API_PROXY_TARGET || TOURNAMENT_API_BASE).replace(/\/$/, "");

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/games/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "game_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const full = request.nextUrl.searchParams.get("full") === "true";
  try {
    const res = await fetch(
      `${API_BASE}/runtime/judge/games/${encodeURIComponent(slug)}/sync?full=${full}`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(),
      },
    );
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "sync_failed" }, { status: 503 });
  }
}
