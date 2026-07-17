import {
  CATALOG_CAPABILITIES_NO_PRICES,
  type ProviderCapabilities,
} from "../../registry/ProviderRegistry.js";
import { BEACHHEAD_GAME_CODE, BEACHHEAD_PROVIDER_ID } from "../../beachhead.js";
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
import {
  getCardById,
  listCardsBySet,
  listSets,
  loadLorcanaDataset,
} from "./DatasetLoader.js";
import { resolveLorcanaImageUrl } from "./ImageResolver.js";
import { mapCard, mapSet, mapVariants } from "./MetadataMapper.js";

/**
 * Lorcana CatalogProvider — beachhead Release 1 (ADR-012).
 * Lê dataset versionado local; nunca busca preços; sem HTTP no caminho quente.
 */
export class LorcanaProvider implements CatalogProvider {
  readonly providerId = BEACHHEAD_PROVIDER_ID;
  readonly gameCode = BEACHHEAD_GAME_CODE;
  readonly capabilities: ProviderCapabilities = {
    ...CATALOG_CAPABILITIES_NO_PRICES,
    rulings: false,
  };

  async syncSets(ctx: SyncContext): Promise<SyncResult<SetDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    loadLorcanaDataset();
    const items = listSets().map(mapSet);
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncCards(ctx: SyncContext, setRef: string): Promise<SyncResult<CardDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    loadLorcanaDataset();
    let cards = listCardsBySet(setRef);
    if (!ctx.full && cards.length > 200) {
      cards = cards.slice(0, 200);
    }
    const items = cards.map(mapCard);
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncVariants(ctx: SyncContext, cardId: string): Promise<SyncResult<VariantDTO>> {
    if (ctx.flags?.enableVariants === false) return { ok: true, count: 0, items: [] };
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const card = getCardById(cardId);
    if (!card) return { ok: false, count: 0, items: [], errors: [`card_not_found:${cardId}`] };
    const items = mapVariants(card);
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncImages(ctx: SyncContext, cardId: string): Promise<SyncResult<ImageJobDTO>> {
    if (ctx.flags?.enableImages === false) return { ok: true, count: 0, items: [] };
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    const card = getCardById(cardId);
    if (!card) return { ok: false, count: 0, items: [], errors: [`card_not_found:${cardId}`] };
    const url = resolveLorcanaImageUrl(card);
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
    const card = getCardById(cardId);
    if (!card) return { ok: false, count: 0, items: [], errors: [`card_not_found:${cardId}`] };
    const items = Object.entries(card.legalities ?? {}).map(([format, status]) => ({
      format,
      status,
    }));
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncRulings(ctx: SyncContext, _cardId: string): Promise<SyncResult<RulingDTO>> {
    if (ctx.flags?.enableRulings === false || ctx.mode === "OFF") {
      return { ok: true, count: 0, items: [] };
    }
    // R1: dataset sem rulings oficiais — capability false; método no-op seguro.
    return { ok: true, count: 0, items: [], shadow: ctx.mode === "SHADOW" };
  }
}
