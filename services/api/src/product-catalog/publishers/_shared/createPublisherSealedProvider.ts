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
  /**
   * ADR-016 packshot allowlist — optional curated override looked up by product SKU
   * (e.g. `${game}-BOX-${code}` or `${game}-PACK-${code}`).
   * Takes priority over `set.imageUrl`/`logoUrl` when present for BOX only.
   * PACK never falls back to set logo/icon (honesty > fake packshot).
   */
  packshotUrlForSku?: (sku: string) => string | undefined;
}

/** ADR-016: never promote a `*.example` placeholder CDN URL as a real product image. */
function isUsablePackshotUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.length > 0 && !url.includes(".example");
}

/**
 * Shared sealed publisher provider — API → site → manifest → Liga (elsewhere).
 * Emits Booster Box + Booster Pack per set (founder auth 2026-07-24).
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
          const code = set.code.toUpperCase();
          const skuBox = `${config.game}-BOX-${code}`;
          const skuPack = `${config.game}-PACK-${code}`;
          const rawImg = set.imageUrl ?? set.logoUrl;
          const boxImg =
            config.packshotUrlForSku?.(skuBox) ?? (isUsablePackshotUrl(rawImg) ? rawImg : undefined);
          // ADR-016: pack art ≠ box art; only curated PACK SKU URLs, never logo reuse.
          const packImg = config.packshotUrlForSku?.(skuPack);

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
                images: boxImg ? [{ sourceUrl: boxImg, isPrimary: true }] : [],
              },
            ],
          });

          items.push({
            providerRef: `${config.providerId}:${set.code}:pack`,
            manufacturerName: config.publisher,
            brandName: config.brand,
            category: ProductCategory.SEALED_PRODUCT,
            subcategory: "BOOSTER_PACK",
            sku: skuPack,
            titlePt: `Booster Pack — ${set.name}`,
            titleEn: `Booster Pack — ${set.name}`,
            game: config.game,
            gameCodes: [config.game],
            collectionName: set.name,
            releaseDate: set.releaseDate,
            variants: [
              {
                providerRef: `${config.providerId}:${set.code}:pack:default`,
                variantName: "Padrão",
                sku: skuPack,
                images: packImg ? [{ sourceUrl: packImg, isPrimary: true }] : [],
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
