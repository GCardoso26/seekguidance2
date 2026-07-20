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
import {
  getCardById,
  listCardsBySet,
  listSets,
  loadPokemonDataset,
} from "./DatasetLoader.js";
import { resolvePokemonImageUrl } from "./ImageResolver.js";
import { mapCard, mapSet, mapVariants } from "./MetadataMapper.js";

export const POKEMON_PROVIDER_ID = "pokemon-dataset";
export const POKEMON_GAME_CODE = "POKEMON";

/**
 * Pokémon CatalogProvider — R2 (ADR-013).
 * Dataset versionado para SHADOW/certificação; default registry OFF/SHADOW (ADR-006).
 * Não escreve preços. Não usa sync Python legado como caminho de Catalog.
 */
export class PokemonProvider implements CatalogProvider {
  readonly providerId = POKEMON_PROVIDER_ID;
  readonly gameCode = POKEMON_GAME_CODE;
  readonly capabilities: ProviderCapabilities = {
    ...CATALOG_CAPABILITIES_NO_PRICES,
    rulings: false,
  };

  async syncSets(ctx: SyncContext): Promise<SyncResult<SetDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    loadPokemonDataset();
    const items = listSets().map(mapSet);
    return { ok: true, count: items.length, items, shadow: ctx.mode === "SHADOW" };
  }

  async syncCards(ctx: SyncContext, setRef: string): Promise<SyncResult<CardDTO>> {
    if (ctx.mode === "OFF") return { ok: true, count: 0, items: [] };
    loadPokemonDataset();
    let cards = listCardsBySet(setRef);
    if (!ctx.full && cards.length > 200) cards = cards.slice(0, 200);
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
    const url = resolvePokemonImageUrl(card);
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

  async syncRulings(_ctx: SyncContext, _cardId: string): Promise<SyncResult<RulingDTO>> {
    return { ok: true, count: 0, items: [] };
  }
}
