import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await ctx.params;
  try {
    const body = await req.text();
    const res = await fetchApiResilient(
      `/runtime/judge/stores/${encodeURIComponent(storeId)}`,
      {
        method: "PUT",
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
