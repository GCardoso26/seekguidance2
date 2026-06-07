import { NextRequest } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Params = { params: Promise<{ roundId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { roundId } = await params;
  const upstream = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournament/timers/${roundId}/stream`, {
    cache: "no-store",
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
