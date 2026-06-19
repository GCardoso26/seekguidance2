import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments/${id}/bracket`, {
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
