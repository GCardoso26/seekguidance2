import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import {
  FF_LIGA_IMAGE_FALLBACK,
  isProductCatalogFlagOn,
} from "../../application/featureEnv.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";
import {
  fetchLigaPublicProductPage,
  LIGA_PORTALS,
} from "./LigaPublicImageFallback.js";

/**
 * Priority 3 fallback — only when FF on.
 * Seeds come from PRODUCT_CATALOG_LIGA_SEED_URLS (comma-separated public product URLs).
 */
export class LigaPublicImageFallbackProvider extends BaseProductCatalogProvider {
  readonly providerId = "liga-public-image-fallback";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    if (!isProductCatalogFlagOn(FF_LIGA_IMAGE_FALLBACK)) {
      return { ok: true, count: 0, items: [] };
    }

    const seeds = (process.env.PRODUCT_CATALOG_LIGA_SEED_URLS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!seeds.length) {
      return { ok: true, count: 0, items: [], errors: ["liga_no_seed_urls"] };
    }

    const items: ImportedProductDTO[] = [];
    const errors: string[] = [];

    for (const url of seeds) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        const portal = Object.values(LIGA_PORTALS).find((v) => {
          const portalHost = new URL(v.baseUrl).hostname.replace(/^www\./, "");
          return host === portalHost || host.endsWith(`.${portalHost}`);
        });

        const meta = await fetchLigaPublicProductPage(url);
        if (!meta.imageUrl || !meta.name) {
          errors.push(`liga_incomplete:${url}`);
          continue;
        }
        const game = portal?.game ?? "MTG";
        const sku = `LIGA-${game}-${Buffer.from(url).toString("base64url").slice(0, 16)}`;
        items.push({
          providerRef: `liga:${sku}`,
          manufacturerName: "Publisher",
          brandName: game,
          category: ProductCategory.SEALED_PRODUCT,
          subcategory: (meta.productType ?? "BOOSTER_BOX").toUpperCase().replace(/\s+/g, "_"),
          sku,
          titlePt: meta.name,
          game,
          gameCodes: [game],
          collectionName: meta.expansion ?? undefined,
          variants: [
            {
              providerRef: `liga:${sku}:default`,
              variantName: "Padrão",
              sku,
              images: [{ sourceUrl: meta.imageUrl, isPrimary: true }],
            },
          ],
        });
      } catch (e) {
        errors.push(`liga:${url}:${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { ok: errors.length === 0, count: items.length, items, errors: errors.length ? errors : undefined };
  }
}
