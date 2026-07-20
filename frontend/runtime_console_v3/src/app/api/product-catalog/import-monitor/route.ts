import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET() {
  const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/import-monitor`, {
    headers: await tournamentProxyHeaders(),
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
