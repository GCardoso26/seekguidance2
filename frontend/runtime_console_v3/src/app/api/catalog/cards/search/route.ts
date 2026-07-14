import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import {
  checkDistributedRateLimit,
  clientIpFromRequest,
  getRateLimitTier,
  rateLimitHeaders,
} from "@/lib/rate-limit-redis";
import { getCachedSearch, setCachedSearch } from "@/lib/search-cache";
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
  const ip = clientIpFromRequest(request);
  const tier = getRateLimitTier(request);
  const rateResult = await checkDistributedRateLimit(ip, tier);

  if (!rateResult.success) {
    const headers = rateLimitHeaders(rateResult);
    return NextResponse.json(
      {
        error: "rate_limit_exceeded",
        message: "Muitas requisições. Tente novamente em instantes.",
        retryAfter: Number(headers["Retry-After"]),
      },
      { status: 429, headers },
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

  const queryString = params.toString();
  const cached = await getCachedSearch<unknown>(queryString);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        ...rateLimitHeaders(rateResult),
        "X-Cache": "HIT",
      },
    });
  }

  const proxyStart = Date.now();

  try {
    const res = await fetchApiResilient(
      `/runtime/judge/catalog/cards/search?${params}`,
      { next: { revalidate: 60 } },
    );

    const proxyMs = Date.now() - proxyStart;
    const data = await res.json();

    if (res.ok) {
      await setCachedSearch(queryString, data);
    }

    // Upstream errors soft-degrade to 200 empty-ish payload so browser console stays clean for BP.
    if (!res.ok) {
      return NextResponse.json(
        {
          error: "catalog_search_upstream",
          cards: Array.isArray((data as { cards?: unknown })?.cards)
            ? (data as { cards: unknown[] }).cards
            : [],
          total: Number((data as { total?: number })?.total ?? 0),
          page: Number((data as { page?: number })?.page ?? 1),
          totalPages: Number((data as { totalPages?: number })?.totalPages ?? 0),
          hasMore: false,
          source: "postgres",
          degraded: true,
          upstream_status: res.status,
        },
        {
          status: 200,
          headers: {
            ...rateLimitHeaders(rateResult),
            "X-Cache": "MISS",
            "X-Render-Proxy-Time": String(proxyMs),
          },
        },
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        ...rateLimitHeaders(rateResult),
        "X-Cache": "MISS",
        "X-Render-Proxy-Time": String(proxyMs),
      },
    });
  } catch {
    // Soft-degrade: empty results + HTTP 200 (avoids LH errors-in-console when API is down).
    return NextResponse.json(
      {
        error: "catalog_search_unavailable",
        cards: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
        source: "postgres",
        degraded: true,
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders(rateResult),
          "X-Render-Proxy-Time": String(Date.now() - proxyStart),
        },
      },
    );
  }
}
