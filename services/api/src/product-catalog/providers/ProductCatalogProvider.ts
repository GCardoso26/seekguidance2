import type { ProductCategory } from "../domain/enums.js";
import type { ImportedImageDTO, ImportedProductDTO, ImportedVariantDTO } from "../domain/models.js";

export interface ProductCatalogSyncResult<T = unknown> {
  ok: boolean;
  count: number;
  items?: T[];
  errors?: string[];
}

export interface ProductCatalogSyncContext {
  requestId: string;
  mode: "full" | "incremental";
  dryRun?: boolean;
  /** Import incremental — providers filtram itens alterados desde esta data (ISO). */
  syncSince?: string;
}

export interface ProductCatalogProviderHealth {
  ok: boolean;
  message?: string;
  lastCheckedAt: string;
}

/**
 * Provider independente por fabricante/fonte.
 * Desacoplado do CatalogProvider de cartas.
 */
export interface ProductCatalogProvider {
  readonly providerId: string;
  readonly category: ProductCategory;

  syncProducts(ctx: ProductCatalogSyncContext): Promise<ProductCatalogSyncResult<ImportedProductDTO>>;
  syncProductsSince?(
    since: string,
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>>;
  syncVariants(
    ctx: ProductCatalogSyncContext,
    productRef: string,
  ): Promise<ProductCatalogSyncResult<ImportedVariantDTO>>;
  syncImages(
    ctx: ProductCatalogSyncContext,
    variantRef: string,
  ): Promise<ProductCatalogSyncResult<ImportedImageDTO>>;
  healthCheck?(): Promise<ProductCatalogProviderHealth>;
}

export type ProductCatalogJobKey =
  | "catalog.sync.sealed"
  | "catalog.sync.sleeves"
  | "catalog.sync.deckboxes"
  | "catalog.sync.binders"
  | "catalog.sync.pages"
  | "catalog.sync.dice"
  | "catalog.sync.counters"
  | "catalog.sync.playmats";

export const JOB_KEY_TO_CATEGORY: Record<ProductCatalogJobKey, ProductCategory> = {
  "catalog.sync.sealed": "SEALED_PRODUCT",
  "catalog.sync.sleeves": "SLEEVES",
  "catalog.sync.deckboxes": "DECK_BOX",
  "catalog.sync.binders": "BINDER",
  "catalog.sync.pages": "BINDER_PAGE",
  "catalog.sync.dice": "DICE",
  "catalog.sync.counters": "COUNTERS",
  "catalog.sync.playmats": "PLAYMAT",
};
