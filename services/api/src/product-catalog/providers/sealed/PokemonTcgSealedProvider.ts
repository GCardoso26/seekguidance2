import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";

type PokemonSet = {
  id: string;
  name: string;
  series?: string;
  releaseDate?: string;
  images?: { symbol?: string; logo?: string };
};

/**
 * Pokémon sealed products — Priority 1: official Pokémon TCG API images (logo/symbol).
 * Does not invent packshots beyond what the API provides.
 */
export class PokemonTcgSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "pokemon-tcg-sealed";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    const apiKey = process.env.POKEMONTCG_API_KEY?.trim();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) headers["X-Api-Key"] = apiKey;

    const res = await fetch("https://api.pokemontcg.io/v2/sets?pageSize=50&orderBy=-releaseDate", {
      headers,
    });
    if (!res.ok) {
      return { ok: false, count: 0, errors: [`pokemon_tcg_http_${res.status}`] };
    }
    const body = (await res.json()) as { data?: PokemonSet[] };
    const items: ImportedProductDTO[] = [];
    for (const set of body.data ?? []) {
      if (!set.id || !set.name) continue;
      const logo = set.images?.logo ?? set.images?.symbol;
      const sku = `PKM-ETB-${set.id.toUpperCase()}`;
      items.push({
        providerRef: `pokemon-set-${set.id}-etb`,
        manufacturerName: "The Pokémon Company",
        brandName: "Pokémon TCG",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "ELITE_TRAINER_BOX",
        sku,
        titlePt: `Elite Trainer Box — ${set.name}`,
        titleEn: `Elite Trainer Box — ${set.name}`,
        game: "POKEMON",
        gameCodes: ["POKEMON"],
        collectionName: set.name,
        releaseDate: set.releaseDate,
        variants: [
          {
            providerRef: `pokemon-set-${set.id}-etb-default`,
            variantName: "Padrão",
            sku,
            images: logo ? [{ sourceUrl: logo, isPrimary: true }] : [],
          },
        ],
      });
      const boxSku = `PKM-BOX-${set.id.toUpperCase()}`;
      items.push({
        providerRef: `pokemon-set-${set.id}-box`,
        manufacturerName: "The Pokémon Company",
        brandName: "Pokémon TCG",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BOOSTER_BOX",
        sku: boxSku,
        titlePt: `Booster Box — ${set.name}`,
        titleEn: `Booster Box — ${set.name}`,
        game: "POKEMON",
        gameCodes: ["POKEMON"],
        collectionName: set.name,
        releaseDate: set.releaseDate,
        variants: [
          {
            providerRef: `pokemon-set-${set.id}-box-default`,
            variantName: "Padrão",
            sku: boxSku,
            images: set.images?.symbol
              ? [{ sourceUrl: set.images.symbol, isPrimary: true }]
              : logo
                ? [{ sourceUrl: logo, isPrimary: true }]
                : [],
          },
        ],
      });
    }
    return this.ok(items);
  }
}
