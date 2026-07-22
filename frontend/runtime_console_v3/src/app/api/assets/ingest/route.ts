import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/assets/ingest`, {
    method: "POST",
    headers: { ...(await tournamentProxyHeaders(req)), "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
