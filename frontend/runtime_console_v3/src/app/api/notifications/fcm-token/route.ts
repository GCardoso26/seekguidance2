import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const body = JSON.stringify({
      token: raw.token,
      platform: raw.platform ?? "web",
    });
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/fcm-subscribe`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
