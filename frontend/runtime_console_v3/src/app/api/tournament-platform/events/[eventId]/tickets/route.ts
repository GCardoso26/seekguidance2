import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await ctx.params;
  try {
    const body = await req.text();
    const res = await fetchApiResilient(
      `/runtime/judge/tournament-platform/events/${encodeURIComponent(eventId)}/tickets`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(req),
        body,
        cache: "no-store",
      },
    );
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await ctx.params;
  try {
    const res = await fetchApiResilient(
      `/runtime/judge/tournament-platform/events/${encodeURIComponent(eventId)}/tickets`,
      {
        headers: await tournamentProxyHeaders(_req),
        cache: "no-store",
      },
    );
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível", tickets: [] }, { status: 503 });
  }
}
