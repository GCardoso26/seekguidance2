import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../../providers/BaseProductCatalogProvider.js";
import type {
  ProductCatalogSyncContext,
  ProductCatalogSyncResult,
} from "../../providers/ProductCatalogProvider.js";

export interface PublisherSetSeed {
  code: string;
  name: string;
  releaseDate?: string;
  imageUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface PublisherProviderConfig {
  providerId: string;
  game: string;
  publisher: string;
  brand: string;
  /** Priority 1: fetch from official API */
  fetchSets: () => Promise<PublisherSetSeed[]>;
}

/**
 * Shared sealed publisher provider — API → site → manifest → Liga (elsewhere).
 */
export function createPublisherSealedProvider(config: PublisherProviderConfig) {
  return class extends BaseProductCatalogProvider {
    readonly providerId = config.providerId;
    readonly category = ProductCategory.SEALED_PRODUCT;

    override async syncProducts(
      ctx: ProductCatalogSyncContext,
    ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
      void ctx;
      try {
        const sets = await config.fetchSets();
        const items: ImportedProductDTO[] = [];
        for (const set of sets) {
          if (!set.code || !set.name) continue;
          const skuBox = `${config.game}-BOX-${set.code.toUpperCase()}`;
          const img = set.imageUrl ?? set.logoUrl;
          items.push({
            providerRef: `${config.providerId}:${set.code}:box`,
            manufacturerName: config.publisher,
            brandName: config.brand,
            category: ProductCategory.SEALED_PRODUCT,
            subcategory: "BOOSTER_BOX",
            sku: skuBox,
            titlePt: `Booster Box — ${set.name}`,
            titleEn: `Booster Box — ${set.name}`,
            game: config.game,
            gameCodes: [config.game],
            collectionName: set.name,
            releaseDate: set.releaseDate,
            variants: [
              {
                providerRef: `${config.providerId}:${set.code}:box:default`,
                variantName: "Padrão",
                sku: skuBox,
                images: img ? [{ sourceUrl: img, isPrimary: true }] : [],
              },
            ],
          });
        }
        return this.ok(items);
      } catch (e) {
        return {
          ok: false,
          count: 0,
          items: [],
          errors: [`${config.providerId}:${e instanceof Error ? e.message : String(e)}`],
        };
      }
    }
  };
}
