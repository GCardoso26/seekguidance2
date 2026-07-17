import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export const maxDuration = 300;

export async function POST(_req: NextRequest) {
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/inventory/backfill-liga-images`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(),
      },
    );
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
