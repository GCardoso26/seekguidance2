import { NextRequest, NextResponse } from "next/server";
import { API_PROXY_BASE, API_FETCH_TIMEOUT_MS } from "@/lib/api-proxy-base";
import { clientIpFromHeaders, rateLimit } from "@/lib/api/rate-limit";
import { CardSearchSchema, validationErrorResponse } from "@/lib/validation";

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

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  const { success, remaining } = rateLimit(`catalog-search:${ip}`, 30, 60_000);
  if (!success) {
    return NextResponse.json(
      { error: "rate_limit_exceeded", message: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = CardSearchSchema.safeParse({
    ...raw,
    page: raw.page ?? "1",
    limit: raw.limit ?? "24",
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

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

  if (!params.has("limit")) params.set("limit", String(parsed.data.limit));
  if (!params.has("page")) params.set("page", String(parsed.data.page));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

    const res = await fetch(`${API_PROXY_BASE}/runtime/judge/catalog/cards/search?${params}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeoutId);

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
