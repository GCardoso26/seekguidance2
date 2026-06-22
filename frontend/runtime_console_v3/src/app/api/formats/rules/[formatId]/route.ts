import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type RouteContext = { params: Promise<{ formatId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { formatId } = await context.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/formats/rules/${encodeURIComponent(formatId)}`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Formato indisponível" }, { status: 503 });
  }
}
