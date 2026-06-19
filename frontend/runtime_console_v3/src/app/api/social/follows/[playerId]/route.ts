import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ playerId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { playerId } = await params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/follows/${playerId}/status`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ following: false, followerCount: 0 }, { status: 200 });
  }
}

export async function POST(_req: Request, { params }: Params) {
  const { playerId } = await params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/follows/${playerId}`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
