import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

const PARAM_MAP: Record<string, string> = {
  q: "search",
  game_id: "tcg_id",
};

export async function GET(req: NextRequest) {
  const incoming = req.nextUrl.searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of incoming.entries()) {
    if (!value) continue;
    const mapped = PARAM_MAP[key] ?? key;
    params.set(mapped, value);
  }

  if (!params.has("limit")) params.set("limit", "24");
  if (!params.has("page")) params.set("page", "1");

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/products?${params.toString()}`,
      { cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json(
      { products: [], page: 1, limit: 24, total: 0, hasMore: false },
      { status: 503 },
    );
  }
}
