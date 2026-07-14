import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";

const EMPTY = { sets: [] as unknown[], degraded: true };

/**
 * Catalog sets is optional filter data. When the BFF/API is down, return an empty list
 * with HTTP 200 so the page remains usable and Lighthouse does not log console errors.
 */
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
    if (!res.ok) {
      return NextResponse.json({ ...EMPTY, upstream_status: res.status }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
