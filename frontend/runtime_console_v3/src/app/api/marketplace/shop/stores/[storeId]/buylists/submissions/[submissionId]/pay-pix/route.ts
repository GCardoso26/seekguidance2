import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; submissionId: string }> },
) {
  try {
    const { storeId, submissionId } = await params;
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/buylists/submissions/${encodeURIComponent(submissionId)}/pay-pix`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(),
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
