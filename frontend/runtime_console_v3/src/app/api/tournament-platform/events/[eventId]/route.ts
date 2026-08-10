/**
 * GET  /api/tournament-platform/events/:eventId — detalhe público/enriquecido
 * PATCH /api/tournament-platform/events/:eventId — edição seller (auth)
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

type Ctx = { params: Promise<{ eventId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { eventId } = await ctx.params;
  try {
    const res = await fetchApiResilient(
      `/runtime/judge/tournament-platform/events/${encodeURIComponent(eventId)}`,
      {
        headers: await tournamentProxyHeaders(req),
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

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { eventId } = await ctx.params;
  try {
    const headers = await tournamentProxyHeaders(req);
    if (!headers["X-Judge-User-Id"] || !headers.Authorization) {
      return NextResponse.json({ detail: "Autenticação necessária" }, { status: 401 });
    }
    const body = await req.text();
    const res = await fetchApiResilient(
      `/runtime/judge/tournament-platform/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers,
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
