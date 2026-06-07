import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/marketplace/decklists${qs}`, { cache: "no-store" });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
