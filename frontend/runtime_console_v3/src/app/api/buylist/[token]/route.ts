import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/buylists/public/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
