import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

const FORWARD_PARAMS = [
  "q",
  "set",
  "rarity",
  "condition",
  "price_min",
  "price_max",
  "language",
  "foil",
  "sort",
  "page",
  "limit",
] as const;

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const incoming = request.nextUrl.searchParams;
  const qs = new URLSearchParams();

  for (const key of FORWARD_PARAMS) {
    const value = incoming.get(key);
    if (value !== null && value !== "") qs.set(key, value);
  }
  if (!qs.has("limit")) qs.set("limit", "24");
  if (!qs.has("page")) qs.set("page", "1");

  try {
    const res = await fetch(
      `${API_BASE}/runtime/judge/catalog/games/${encodeURIComponent(slug)}/cards?${qs}`,
      { cache: "no-store" },
    );
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json(
      { cards: [], total: 0, page: 1, totalPages: 0, hasMore: false },
      { status: 503 },
    );
  }
}
