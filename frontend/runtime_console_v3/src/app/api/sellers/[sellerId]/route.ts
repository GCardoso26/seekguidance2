import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Params = { params: Promise<{ sellerId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { sellerId } = await params;
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/profile`,
      { next: { revalidate: 120 } },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Vendedor indisponível" }, { status: 503 });
  }
}
