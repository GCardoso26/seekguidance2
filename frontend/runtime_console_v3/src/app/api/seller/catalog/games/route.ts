import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { catalogGamesMock } from "@/lib/seller-catalog-mock";

export async function GET() {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/catalog/games`, {
      headers: await tournamentProxyHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(catalogGamesMock());
  }
}
