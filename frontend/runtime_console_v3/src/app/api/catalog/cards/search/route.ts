import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

const FORWARD_PARAMS = [
  "q",
  "game",
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
  "card_id",
  "colors",
] as const;

export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const params = new URLSearchParams();

  for (const key of FORWARD_PARAMS) {
    if (key === "card_id") {
      const values = incoming.getAll("card_id");
      for (const v of values) {
        if (v) params.append("card_id", v);
      }
      continue;
    }
    const value = incoming.get(key);
    if (value !== null && value !== "") {
      params.set(key, value);
    }
  }

  if (!params.has("limit")) params.set("limit", "24");
  if (!params.has("page")) params.set("page", "1");

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/cards/search?${params}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json(
      {
        error: "catalog_search_unavailable",
        cards: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
        source: "postgres",
      },
      { status: 503 },
    );
  }
}
