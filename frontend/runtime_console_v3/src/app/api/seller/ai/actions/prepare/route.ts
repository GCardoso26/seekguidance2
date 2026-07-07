import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/ai/actions/prepare`, {
      method: "POST",
      headers: {
        ...(await tournamentProxyHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
