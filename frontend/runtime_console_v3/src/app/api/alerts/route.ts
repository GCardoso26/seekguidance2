import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/alerts/price${qs}`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/alerts/price`, {
      method: "POST",
      headers: {
        ...(await tournamentProxyHeaders()),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
