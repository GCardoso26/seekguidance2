import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; saleId: string }> },
) {
  try {
    const { storeId, saleId } = await params;
    const body = await req.text();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/sales/${encodeURIComponent(saleId)}`,
      {
        method: "PATCH",
        headers: {
          ...(await tournamentProxyHeaders()),
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
