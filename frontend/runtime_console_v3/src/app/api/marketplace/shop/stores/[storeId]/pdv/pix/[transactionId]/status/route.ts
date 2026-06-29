import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

const mockPolls = new Map<string, number>();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string; transactionId: string }> },
) {
  try {
    const { storeId, transactionId } = await params;
    const upstream = `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/pix/${encodeURIComponent(transactionId)}/status`;

    try {
      const res = await fetch(upstream, {
        headers: await tournamentProxyHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const text = await res.text();
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      /* mock fallback */
    }

    if (transactionId.startsWith("pdv-manual-")) {
      const count = (mockPolls.get(transactionId) ?? 0) + 1;
      mockPolls.set(transactionId, count);
      return NextResponse.json({
        status: count >= 3 ? "paid" : "pending",
        transaction_id: transactionId,
        sale_id: null,
      });
    }

    return NextResponse.json({ detail: "Transação não encontrada" }, { status: 404 });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
