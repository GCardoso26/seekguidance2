import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/tags${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
