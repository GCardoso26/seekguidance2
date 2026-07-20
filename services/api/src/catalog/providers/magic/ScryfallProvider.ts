import {
  CATALOG_CAPABILITIES_NO_PRICES,
  type ProviderCapabilities,
} from "../../registry/ProviderRegistry.js";
import type {
  CatalogProvider,
  ImageJobDTO,
  RulingDTO,
  SetDTO,
  SyncContext,
  SyncResult,
  VariantDTO,
  CardDTO,
} from "../interfaces/CatalogProvider.js";
import { resolveScryfallImageUrl } from "./ImageResolver.js";
import { mapCard, mapSet, mapVariants } from "./MetadataMapper.js";
import type { ScryfallCard, ScryfallSet } from "./types.js";

const SCRYFALL_API = "https://api.scryfall.com";

async function scryfallGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SCRYFALL_API}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "JudgeTCG/domain-workers" },
  });
  if (!res.ok) {
    throw new Error(`scryfall_http_${res.status}:${path}`);
  }
  return (await res.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Scryfall CatalogProvider (MTG) — modular (Mapper + ImageResolver + GameConfig).
 * Never writes prices. Rollout: OFF → SHADOW → CANARY → LIVE (ADR-006).
 */
export class ScryfallProvider implements CatalogProvider {
  readonly providerId = "scryfall";
  readonly gameCode = "MTG";
  readonly capabilities: ProviderCapabilities = { ...CATALOG_CAPABILITIES_NO_PRICES };

  async syncSets(ctx: SyncContext): Promise<SyncResult<SetDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const data = await scryfallGet<{ data: ScryfallSet[] }>("/sets");
    const items = data.data.filter((s) => !s.digital).map(mapSet);
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncCards(ctx: SyncContext, setCode: string): Promise<SyncResult<CardDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const code = setCode.toLowerCase();
    const items: CardDTO[] = [];
    let nextPath: string | null = `/cards/search?q=${encodeURIComponent(`e:${code}`)}&unique=prints`;

    while (nextPath) {
      const path = nextPath;
      const page: {
        data: ScryfallCard[];
        has_more: boolean;
        next_page?: string;
      } = await scryfallGet(path.startsWith("http") ? path.replace(SCRYFALL_API, "") : path);

      for (const c of page.data) {
        items.push(mapCard(c));
      }

      if (!ctx.full && items.length >= 200) break;
      nextPath = page.has_more && page.next_page ? page.next_page.replace(SCRYFALL_API, "") : null;
      await sleep(100);
    }

    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncVariants(ctx: SyncContext, cardId: string): Promise<SyncResult<VariantDTO>> {
    if (ctx.flags?.enableVariants === false) return { ok: true, count: 0, items: [] };
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const card = await scryfallGet<ScryfallCard>(`/cards/${cardId}`);
    const items = mapVariants(card);
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncImages(ctx: SyncContext, cardId: string): Promise<SyncResult<ImageJobDTO>> {
    if (ctx.flags?.enableImages === false) return { ok: true, count: 0, items: [] };
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const card = await scryfallGet<ScryfallCard>(`/cards/${cardId}`);
    const url = resolveScryfallImageUrl(card);
    if (!url) return { ok: true, count: 0, items: [] };
    return {
      ok: true,
      count: 1,
      items: [
        {
          ownerType: "catalog_card",
          ownerRef: card.id,
          sourceUrl: url,
          provider: this.providerId,
        },
      ],
      shadow: ctx.mode === "SHADOW",
    };
  }

  async syncLegality(
    ctx: SyncContext,
    cardId: string,
  ): Promise<SyncResult<{ format: string; status: string }>> {
    if (ctx.flags?.enableLegality === false) return { ok: true, count: 0, items: [] };
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const card = await scryfallGet<ScryfallCard>(`/cards/${cardId}`);
    const items = Object.entries(card.legalities ?? {}).map(([format, status]) => ({
      format,
      status,
    }));
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncRulings(ctx: SyncContext, cardId: string): Promise<SyncResult<RulingDTO>> {
    if (ctx.flags?.enableRulings === false) return { ok: true, count: 0, items: [] };
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const data = await scryfallGet<{ data: Array<{ published_at?: string; comment: string }> }>(
      `/cards/${cardId}/rulings`,
    );
    const items: RulingDTO[] = data.data.map((r) => ({
      publishedAt: r.published_at,
      text: r.comment,
      source: "scryfall",
    }));
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }
}
