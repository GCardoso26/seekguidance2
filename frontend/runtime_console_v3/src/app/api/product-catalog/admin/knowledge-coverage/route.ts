import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET() {
  const res = await fetch(
    `${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/admin/knowledge-coverage`,
    { cache: "no-store" },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
