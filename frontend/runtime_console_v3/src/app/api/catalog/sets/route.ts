import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get("game");
  const limit = request.nextUrl.searchParams.get("limit");
  const params = new URLSearchParams();
  if (game) params.set("game", game);
  if (limit) params.set("limit", limit);
  const qs = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await fetchApiResilient(`/runtime/judge/catalog/sets${qs}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 503 });
  }
}
