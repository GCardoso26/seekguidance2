import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(
    `${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/products/${encodeURIComponent(productId)}/relationships${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
