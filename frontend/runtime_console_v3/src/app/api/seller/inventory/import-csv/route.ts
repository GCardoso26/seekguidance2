import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

/** Importações grandes (Liga) precisam de mais tempo que o default do gateway. */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/inventory/import-csv`, {
      method: "POST",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
