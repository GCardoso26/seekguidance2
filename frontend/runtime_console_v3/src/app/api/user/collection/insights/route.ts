import { NextResponse } from "next/server";
import { API_PROXY_BASE } from "@/lib/api-proxy-base";
import {
  completionPct,
  gameMetaFromCode,
  liquidityLabel,
  type CollectionEnrichedItem,
  type CollectionGameBreakdown,
  type CollectionInsights,
  type CollectionSetBreakdown,
  type CollectionValueSeriesPoint,
} from "@/lib/collection-v2";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import type { CollectionItem } from "@/hooks/useDeck";

export const dynamic = "force-dynamic";

const MAX_PRICE_ENRICH = 80;
const MAX_HISTORY_SAMPLE = 24;
const CONCURRENCY = 6;

type CatalogCardPayload = {
  card?: {
    id?: string;
    lowestPrice?: number | null;
    latestPrice?: { price?: number; currency?: string } | null;
    marketSummary?: { avgSellerTrust?: number } | null;
    rarity?: string | null;
  };
  lowestPrice?: number | null;
  latestPrice?: { price?: number; currency?: string } | null;
};

type HistoryPoint = { date?: string; timestamp?: string; price?: number; value?: number };

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function unitPriceFromCatalog(data: CatalogCardPayload | null): {
  price: number | null;
  currency: string;
  liquidity: ReturnType<typeof liquidityLabel>;
  premium: boolean;
} {
  if (!data) return { price: null, currency: "BRL", liquidity: "unknown", premium: false };
  const card = data.card ?? data;
  const price =
    (card as CatalogCardPayload["card"])?.lowestPrice ??
    (card as CatalogCardPayload["card"])?.latestPrice?.price ??
    data.lowestPrice ??
    data.latestPrice?.price ??
    null;
  const currency =
    (card as CatalogCardPayload["card"])?.latestPrice?.currency ||
    data.latestPrice?.currency ||
    "BRL";
  const rarity = ((card as CatalogCardPayload["card"])?.rarity || "").toLowerCase();
  const premium = /mythic|legendary|secret|ultra|special|promo|enchanted/.test(rarity);
  return {
    price: typeof price === "number" && Number.isFinite(price) ? price : null,
    currency,
    liquidity: "unknown",
    premium,
  };
}

async function fetchCatalogCard(cardId: string): Promise<CatalogCardPayload | null> {
  try {
    const res = await fetch(
      `${API_PROXY_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as CatalogCardPayload;
  } catch {
    return null;
  }
}

async function fetchPriceHistory(cardId: string, range: string): Promise<HistoryPoint[]> {
  try {
    const res = await fetch(
      `${API_PROXY_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}/price-history?range=${encodeURIComponent(range)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as HistoryPoint[];
    if (Array.isArray(data?.points)) return data.points as HistoryPoint[];
    if (Array.isArray(data?.history)) return data.history as HistoryPoint[];
    return [];
  } catch {
    return [];
  }
}

function pointPrice(p: HistoryPoint): number | null {
  const v = p.price ?? p.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function pointDate(p: HistoryPoint): string | null {
  return p.date || p.timestamp || null;
}

/** Agrega série de portfólio a partir de históricos amostrados (Pricing/Catalog públicos). */
function buildPortfolioSeries(
  samples: Array<{ quantity: number; history: HistoryPoint[] }>,
): { series: CollectionValueSeriesPoint[]; change: number | null; changePct: number | null } {
  const byDate = new Map<string, number>();
  let usable = 0;
  for (const sample of samples) {
    if (!sample.history.length) continue;
    usable += 1;
    for (const pt of sample.history) {
      const d = pointDate(pt);
      const price = pointPrice(pt);
      if (!d || price == null) continue;
      const day = d.slice(0, 10);
      byDate.set(day, (byDate.get(day) ?? 0) + price * sample.quantity);
    }
  }
  if (usable < 2 || byDate.size < 2) {
    return { series: [], change: null, changePct: null };
  }
  const series = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : null;
  return { series, change, changePct };
}

export async function GET() {
  try {
    const headers = await tournamentProxyHeaders();
    const colRes = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/user/collection`, {
      headers,
      cache: "no-store",
    });
    if (colRes.status === 401) {
      return NextResponse.json({ detail: "login_required" }, { status: 401 });
    }
    if (!colRes.ok) {
      return NextResponse.json({ detail: "collection_unavailable" }, { status: colRes.status });
    }
    const colJson = (await colRes.json()) as { items?: CollectionItem[] };
    const rawItems = colJson.items ?? [];

    const uniqueIds = [...new Set(rawItems.map((i) => i.card_id))];
    const enrichIds = uniqueIds.slice(0, MAX_PRICE_ENRICH);
    const catalogMap = new Map<string, CatalogCardPayload | null>();
    await mapPool(enrichIds, CONCURRENCY, async (id) => {
      catalogMap.set(id, await fetchCatalogCard(id));
      return id;
    });

    const enriched: CollectionEnrichedItem[] = rawItems.map((item) => {
      const meta = unitPriceFromCatalog(catalogMap.get(item.card_id) ?? null);
      const unitPrice = meta.price;
      const lineValue = unitPrice == null ? null : unitPrice * item.quantity;
      return {
        ...item,
        unitPrice,
        lineValue,
        currency: meta.currency,
        liquidity: meta.liquidity,
      };
    });

    const totalCards = enriched.reduce((s, i) => s + i.quantity, 0);
    const uniqueCards = enriched.length;
    const duplicates = enriched.filter((i) => i.quantity > 1).reduce((s, i) => s + (i.quantity - 1), 0);
    const foilCount = enriched.filter((i) => i.is_foil).reduce((s, i) => s + i.quantity, 0);
    const premiumCount = enriched.filter((i) => {
      const c = catalogMap.get(i.card_id);
      return unitPriceFromCatalog(c ?? null).premium;
    }).reduce((s, i) => s + i.quantity, 0);

    const priced = enriched.filter((i) => i.lineValue != null);
    const totalValue =
      priced.length === 0
        ? null
        : priced.reduce((s, i) => s + (i.lineValue as number), 0);
    const currency = enriched.find((i) => i.currency)?.currency || "BRL";

    const byGameMap = new Map<string, CollectionGameBreakdown>();
    for (const item of enriched) {
      const code = item.card?.game_code || "unknown";
      const meta = gameMetaFromCode(code);
      const cur = byGameMap.get(code) ?? {
        gameCode: code,
        gameSlug: meta.slug,
        gameName: meta.name,
        quantity: 0,
        uniqueCards: 0,
        value: 0,
        completionPct: null as number | null,
      };
      cur.quantity += item.quantity;
      cur.uniqueCards += 1;
      cur.value += item.lineValue ?? 0;
      byGameMap.set(code, cur);
    }
    const byGame = [...byGameMap.values()].sort((a, b) => b.value - a.value || b.quantity - a.quantity);

    const bySetMap = new Map<string, CollectionSetBreakdown>();
    for (const item of enriched) {
      const setCode = item.card?.set_code || "—";
      const key = `${item.card?.game_code || "unknown"}::${setCode}`;
      const cur = bySetMap.get(key) ?? {
        setCode,
        setName: item.card?.set_name || setCode,
        gameCode: item.card?.game_code || "unknown",
        ownedUnique: 0,
        quantity: 0,
        value: 0,
        setTotal: null,
        missing: null,
        completionPct: null,
      };
      cur.ownedUnique += 1;
      cur.quantity += item.quantity;
      cur.value += item.lineValue ?? 0;
      bySetMap.set(key, cur);
    }
    const bySet = [...bySetMap.values()].sort((a, b) => b.quantity - a.quantity);

    // Optional set totals from Catalog sets API (public)
    try {
      const games = [...new Set(bySet.map((s) => s.gameCode).filter(Boolean))];
      for (const game of games.slice(0, 6)) {
        const setsRes = await fetch(
          `${API_PROXY_BASE}/runtime/judge/catalog/sets?game=${encodeURIComponent(game)}&limit=200`,
          { next: { revalidate: 3600 } },
        );
        if (!setsRes.ok) continue;
        const setsJson = (await setsRes.json()) as {
          sets?: Array<{ code?: string; set_code?: string; card_count?: number; total_cards?: number }>;
        };
        const sets = setsJson.sets ?? [];
        for (const s of bySet) {
          if (s.gameCode !== game) continue;
          const match = sets.find(
            (x) =>
              (x.code || x.set_code || "").toLowerCase() === s.setCode.toLowerCase(),
          );
          const total = match?.card_count ?? match?.total_cards ?? null;
          if (total != null) {
            s.setTotal = total;
            s.missing = Math.max(0, total - s.ownedUnique);
            s.completionPct = completionPct(s.ownedUnique, total);
          }
        }
      }
      // Approximate game completion as mean of known set pcts
      for (const g of byGame) {
        const setPcts = bySet
          .filter((s) => s.gameCode === g.gameCode && s.completionPct != null)
          .map((s) => s.completionPct as number);
        g.completionPct =
          setPcts.length > 0
            ? Math.round((setPcts.reduce((a, b) => a + b, 0) / setPcts.length) * 10) / 10
            : null;
      }
    } catch {
      /* sets optional */
    }

    const recentAcquisitions = [...enriched]
      .filter((i) => i.acquired_at)
      .sort((a, b) => (b.acquired_at ?? "").localeCompare(a.acquired_at ?? ""))
      .slice(0, 12);

    // Portfolio history sample (top by line value)
    const ranked = [...enriched]
      .filter((i) => i.unitPrice != null)
      .sort((a, b) => (b.lineValue ?? 0) - (a.lineValue ?? 0))
      .slice(0, MAX_HISTORY_SAMPLE);

    const hist30 = await mapPool(ranked, CONCURRENCY, async (item) => ({
      quantity: item.quantity,
      history: await fetchPriceHistory(item.card_id, "30d"),
    }));
    const hist7 = await mapPool(ranked.slice(0, 12), CONCURRENCY, async (item) => ({
      quantity: item.quantity,
      history: await fetchPriceHistory(item.card_id, "7d"),
    }));
    const hist90 = await mapPool(ranked.slice(0, 12), CONCURRENCY, async (item) => ({
      quantity: item.quantity,
      history: await fetchPriceHistory(item.card_id, "90d"),
    }));
    const hist1y = await mapPool(ranked.slice(0, 8), CONCURRENCY, async (item) => ({
      quantity: item.quantity,
      history: await fetchPriceHistory(item.card_id, "1y"),
    }));

    const s7 = buildPortfolioSeries(hist7);
    const s30 = buildPortfolioSeries(hist30);
    const s90 = buildPortfolioSeries(hist90);
    const s1y = buildPortfolioSeries(hist1y);

    const insights: CollectionInsights = {
      totalValue,
      currency,
      valueChange7d: s7.change,
      valueChange30d: s30.change,
      valueChange7dPct: s7.changePct,
      valueChange30dPct: s30.changePct,
      series7d: s7.series,
      series30d: s30.series,
      series90d: s90.series,
      series1y: s1y.series,
      totalCards,
      uniqueCards,
      duplicates,
      foilCount,
      premiumCount,
      sealedCount: 0,
      accessoryCount: 0,
      avgLiquidity: liquidityLabel(null),
      updatedAt: new Date().toISOString(),
      byGame,
      bySet,
      recentAcquisitions,
      items: enriched,
      insufficientHistory: s7.series.length < 2 && s30.series.length < 2,
    };

    return NextResponse.json(insights);
  } catch {
    return NextResponse.json({ detail: "insights_unavailable" }, { status: 503 });
  }
}
