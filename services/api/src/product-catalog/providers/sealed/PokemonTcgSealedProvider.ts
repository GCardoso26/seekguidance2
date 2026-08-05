import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";
import { fetchWithTransientRetry } from "../fetchWithTransientRetry.js";
import { createPackshotUrlForSku } from "./publisherPackshots.js";

type PokemonSet = {
  id: string;
  name: string;
  series?: string;
  releaseDate?: string;
  images?: { symbol?: string; logo?: string };
};

const packshotUrlForSku = createPackshotUrlForSku("pokemon");

function imagesForSku(sku: string): { sourceUrl: string; isPrimary: true }[] {
  const url = packshotUrlForSku(sku);
  return url ? [{ sourceUrl: url, isPrimary: true }] : [];
}

/**
 * Pokémon sealed products — Priority 1: official Pokémon TCG API set metadata.
 * ADR-016: the API's logo/symbol fields are set icons, not product packshots —
 * they must not be promoted as the primary product image. Images come only from
 * the curated sealed-packshots.manifest.json allowlist (honesty > fake placeholder).
 */
export class PokemonTcgSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "pokemon-tcg-sealed";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    const apiKey = process.env.POKEMONTCG_API_KEY?.trim();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "JudgeTCG/product-catalog (https://judgetcg.com.br)",
    };
    if (apiKey) headers["X-Api-Key"] = apiKey;

    const url = "https://api.pokemontcg.io/v2/sets?pageSize=50&orderBy=-releaseDate";
    const res = await fetchWithTransientRetry(url, { headers }, { attempts: 4, baseDelayMs: 500 });
    if (!res.ok) {
      return { ok: false, count: 0, errors: [`pokemon_tcg_http_${res.status}`] };
    }
    const body = (await res.json()) as { data?: PokemonSet[] };
    const items: ImportedProductDTO[] = [];
    for (const set of body.data ?? []) {
      if (!set.id || !set.name) continue;
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
            images: imagesForSku(sku),
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
            images: imagesForSku(boxSku),
          },
        ],
      });
      const packSku = `PKM-PACK-${set.id.toUpperCase()}`;
      items.push({
        providerRef: `pokemon-set-${set.id}-pack`,
        manufacturerName: "The Pokémon Company",
        brandName: "Pokémon TCG",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BOOSTER_PACK",
        sku: packSku,
        titlePt: `Booster Pack — ${set.name}`,
        titleEn: `Booster Pack — ${set.name}`,
        game: "POKEMON",
        gameCodes: ["POKEMON"],
        collectionName: set.name,
        releaseDate: set.releaseDate,
        variants: [
          {
            providerRef: `pokemon-set-${set.id}-pack-default`,
            variantName: "Padrão",
            sku: packSku,
            images: imagesForSku(packSku),
          },
        ],
      });
    }
    return this.ok(items);
  }
}
