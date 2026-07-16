import {
  CATALOG_CAPABILITIES_NO_PRICES,
  type ProviderCapabilities,
} from "../../registry/ProviderRegistry.js";
import type {
  CardDTO,
  CatalogProvider,
  ImageJobDTO,
  RulingDTO,
  SetDTO,
  SyncContext,
  SyncResult,
  VariantDTO,
} from "../interfaces/CatalogProvider.js";

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

interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  released_at?: string;
  card_count?: number;
  digital?: boolean;
}

interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  collector_number?: string;
  rarity?: string;
  lang?: string;
  oracle_text?: string;
  type_line?: string;
  artist?: string;
  legalities?: Record<string, string>;
  image_uris?: { normal?: string; large?: string; png?: string };
  card_faces?: Array<{ image_uris?: { normal?: string }; oracle_text?: string; type_line?: string }>;
  finishes?: string[];
  foil?: boolean;
  nonfoil?: boolean;
}

/**
 * Scryfall CatalogProvider (MTG).
 * Phase 1: fetch + map DTOs. Persist/enqueue wired by CatalogSyncService.
 * Never writes prices (capabilities.prices = false).
 */
export class ScryfallProvider implements CatalogProvider {
  readonly providerId = "scryfall";
  readonly gameCode = "MTG";
  readonly capabilities: ProviderCapabilities = { ...CATALOG_CAPABILITIES_NO_PRICES };

  async syncSets(ctx: SyncContext): Promise<SyncResult<SetDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const data = await scryfallGet<{ data: ScryfallSet[] }>("/sets");
    const items: SetDTO[] = data.data
      .filter((s) => !s.digital)
      .map((s) => ({
        providerSetId: s.id,
        code: s.code.toUpperCase(),
        name: s.name,
        releaseDate: s.released_at,
      }));
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

  async syncVariants(ctx: SyncContext, _cardId: string): Promise<SyncResult<VariantDTO>> {
    if (ctx.flags?.enableVariants === false) return { ok: true, count: 0, items: [] };
    // Variants are derived from finishes on the card payload during syncCards in later phases.
    return { ok: true, count: 0, items: [] };
  }

  async syncImages(ctx: SyncContext, cardId: string): Promise<SyncResult<ImageJobDTO>> {
    if (ctx.flags?.enableImages === false) return { ok: true, count: 0, items: [] };
    // Caller supplies image URL via card DTO; this method is for re-sync by id.
    const card = await scryfallGet<ScryfallCard>(`/cards/${cardId}`);
    const url =
      card.image_uris?.normal ??
      card.card_faces?.[0]?.image_uris?.normal ??
      null;
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
    const card = await scryfallGet<ScryfallCard>(`/cards/${cardId}`);
    const items = Object.entries(card.legalities ?? {}).map(([format, status]) => ({
      format,
      status,
    }));
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncRulings(ctx: SyncContext, cardId: string): Promise<SyncResult<RulingDTO>> {
    if (ctx.flags?.enableRulings === false) return { ok: true, count: 0, items: [] };
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

function mapCard(c: ScryfallCard): CardDTO {
  const imageUrl =
    c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? undefined;
  return {
    providerCardId: c.id,
    providerSetId: c.set,
    name: c.name,
    normalizedName: c.name.trim().toLowerCase().replace(/\s+/g, " "),
    cardNumber: c.collector_number,
    rarity: c.rarity,
    language: c.lang,
    oracleText: c.oracle_text ?? c.card_faces?.[0]?.oracle_text,
    typeLine: c.type_line ?? c.card_faces?.[0]?.type_line,
    artist: c.artist,
    imageUrl,
    legalities: c.legalities,
    gameData: {
      finishes: c.finishes,
      foil: c.foil,
      nonfoil: c.nonfoil,
      scryfall_id: c.id,
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
