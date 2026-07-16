import type { DomainEvent } from "../../shared/events/types.js";
import type { SearchCardDocument } from "../domain/SearchDocument.js";
import type { SearchProjectionRepository } from "../domain/SearchProjectionRepository.js";
import { metrics } from "../../platform/metrics/registry.js";
import { getClock } from "../../shared/time/Clock.js";
import type { ProjectionManager } from "../ProjectionManager.js";

const SEARCH_EVENTS = new Set([
  "CardUpdated",
  "VariantUpdated",
  "MediaUpdated",
  "MarketplaceListingUpdated",
  "PriceUpdated",
]);

export function isSearchProjectionEvent(eventType: string): boolean {
  return SEARCH_EVENTS.has(eventType);
}

export interface ApplySearchEventOpts {
  projectionManager?: ProjectionManager;
}

/**
 * Application service — applies domain events onto Search projection.
 * Never opens Catalog repos. Never calls Providers.
 */
export class ApplySearchEventApplicationService {
  constructor(
    private readonly projection: SearchProjectionRepository,
    private readonly opts: ApplySearchEventOpts = {},
  ) {}

  async execute(event: DomainEvent): Promise<"applied" | "ignored"> {
    if (!isSearchProjectionEvent(event.eventType)) return "ignored";

    const meta = event.metadata;
    const live = this.projection.getVersion();
    if (
      meta.projectionVersion &&
      meta.projectionVersion !== live.name &&
      live.status === "live"
    ) {
      return "ignored";
    }

    const t0 = getClock().nowMs();
    const existing = await this.projection.get(resolveDocumentId(event));
    const next = mergeDocument(existing, event, live.name);
    await this.projection.upsert(next);
    const eventId = event.id ?? `${event.eventType}:${event.aggregateId}:${meta.occurredAt}`;
    this.projection.recordAppliedEvent(eventId, meta.occurredAt);

    const occurredMs = Date.parse(meta.occurredAt);
    if (Number.isFinite(occurredMs) && this.opts.projectionManager) {
      this.opts.projectionManager.recordLeadTime({
        eventId,
        eventType: event.eventType,
        providerToSearchableMs: Math.max(0, getClock().nowMs() - occurredMs),
      });
    }

    metrics.observe("search_consume_ms", getClock().nowMs() - t0, {
      eventType: event.eventType,
    });
    metrics.inc("search_events_applied_total", { eventType: event.eventType });
    return "applied";
  }
}

function resolveDocumentId(event: DomainEvent): string {
  const p = event.payload as Record<string, unknown>;
  if (event.eventType === "MarketplaceListingUpdated" && typeof p.cardId === "string") {
    return p.cardId;
  }
  if (event.eventType === "VariantUpdated" && typeof p.cardId === "string") {
    return p.cardId;
  }
  return event.aggregateId;
}

function mergeDocument(
  existing: SearchCardDocument | null,
  event: DomainEvent,
  projection: string,
): SearchCardDocument {
  const p = event.payload as Record<string, unknown>;
  const base: SearchCardDocument = existing ?? emptyDoc(resolveDocumentId(event), projection);

  switch (event.eventType) {
    case "CardUpdated":
      return {
        ...base,
        name: str(p.name, base.name) || base.id,
        nameNormalized: str(p.normalizedName, base.nameNormalized) || (str(p.name, "") || base.id).toLowerCase(),
        oracleText: strOrNull(p.oracleText, base.oracleText),
        setCode: strOrNull(p.setCode, base.setCode)?.toUpperCase() ?? base.setCode,
        setName: strOrNull(p.setName, base.setName),
        language: str(p.language, base.language) || "en",
        rarity: strOrNull(p.rarity, base.rarity),
        projection,
        updatedAt: event.metadata.occurredAt,
      };
    case "VariantUpdated": {
      const finish = strOrNull(p.finish, null);
      const finishes = finish
        ? Array.from(new Set([...base.finishes, finish]))
        : base.finishes;
      return { ...base, finishes, projection, updatedAt: event.metadata.occurredAt };
    }
    case "MediaUpdated":
      return {
        ...base,
        imageUrl: strOrNull(p.imageUrl ?? p.url, base.imageUrl),
        projection,
        updatedAt: event.metadata.occurredAt,
      };
    case "PriceUpdated": {
      const market = num(p.market ?? p.price ?? p.priceMin);
      const priceMin = market ?? base.priceMin;
      const priceMax = num(p.priceMax) ?? market ?? base.priceMax;
      return {
        ...base,
        priceMin,
        priceMax,
        currency: strOrNull(p.currency, base.currency),
        projection,
        updatedAt: event.metadata.occurredAt,
      };
    }
    case "MarketplaceListingUpdated": {
      const storeId = strOrNull(p.storeId, null);
      const storeIds = storeId
        ? Array.from(new Set([...base.storeIds, storeId]))
        : base.storeIds;
      const stock = num(p.stock ?? p.quantity);
      const stockTotal =
        stock != null ? Math.max(0, stock) : num(p.stockTotal) ?? base.stockTotal;
      return {
        ...base,
        storeIds,
        stockTotal,
        hasStock: stockTotal > 0,
        priceMin: num(p.price) ?? base.priceMin,
        priceMax: num(p.price) ?? base.priceMax,
        currency: strOrNull(p.currency, base.currency),
        finishes: strOrNull(p.finish, null)
          ? Array.from(new Set([...base.finishes, String(p.finish)]))
          : base.finishes,
        projection,
        updatedAt: event.metadata.occurredAt,
      };
    }
    default:
      return { ...base, projection, updatedAt: event.metadata.occurredAt };
  }
}

function emptyDoc(id: string, projection: string): SearchCardDocument {
  return {
    id,
    name: "",
    nameNormalized: "",
    oracleText: null,
    setCode: null,
    setName: null,
    language: "en",
    rarity: null,
    finishes: [],
    priceMin: null,
    priceMax: null,
    currency: null,
    storeIds: [],
    stockTotal: 0,
    hasStock: false,
    imageUrl: null,
    projection,
    updatedAt: new Date(0).toISOString(),
  };
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function strOrNull(v: unknown, fallback: string | null): string | null {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string") return v || null;
  return fallback;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}
