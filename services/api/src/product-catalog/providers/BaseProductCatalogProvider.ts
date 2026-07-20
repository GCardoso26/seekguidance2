import type { ProductCategory } from "../domain/enums.js";
import type { ImportedImageDTO, ImportedProductDTO, ImportedVariantDTO } from "../domain/models.js";
import type {
  ProductCatalogProvider,
  ProductCatalogSyncContext,
  ProductCatalogSyncResult,
} from "./ProductCatalogProvider.js";

export abstract class BaseProductCatalogProvider implements ProductCatalogProvider {
  abstract readonly providerId: string;
  abstract readonly category: ProductCategory;

  async syncProducts(ctx: ProductCatalogSyncContext): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    return { ok: true, count: 0, items: [] };
  }

  async syncProductsSince(
    since: string,
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    const full = await this.syncProducts({ ...ctx, mode: "incremental", syncSince: since });
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return full;
    const filtered =
      full.items?.filter((item) => {
        if (!item.releaseDate) return true;
        const rd = Date.parse(item.releaseDate);
        return !Number.isFinite(rd) || rd >= sinceMs;
      }) ?? [];
    return { ok: full.ok, count: filtered.length, items: filtered, errors: full.errors };
  }

  async healthCheck(): Promise<import("./ProductCatalogProvider.js").ProductCatalogProviderHealth> {
    return { ok: true, lastCheckedAt: new Date().toISOString() };
  }

  async syncVariants(
    ctx: ProductCatalogSyncContext,
    productRef: string,
  ): Promise<ProductCatalogSyncResult<ImportedVariantDTO>> {
    void ctx;
    void productRef;
    return { ok: true, count: 0, items: [] };
  }

  async syncImages(
    ctx: ProductCatalogSyncContext,
    variantRef: string,
  ): Promise<ProductCatalogSyncResult<ImportedImageDTO>> {
    void ctx;
    void variantRef;
    return { ok: true, count: 0, items: [] };
  }

  ok<T>(items: T[]): ProductCatalogSyncResult<T> {
    return { ok: true, count: items.length, items };
  }
}
