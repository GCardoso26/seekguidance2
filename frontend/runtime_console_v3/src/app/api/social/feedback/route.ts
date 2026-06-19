import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  const body = await req.text();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/feedback`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/feedback${qs ? `?${qs}` : ""}`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
