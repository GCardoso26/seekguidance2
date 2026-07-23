import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import {
  FF_CENTRAL_DRIVE_API,
  isProductCatalogFlagOn,
} from "../../application/featureEnv.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";
import {
  driveImagesToManifestItems,
  GoogleDriveListClient,
  listCentralDriveImages,
} from "../../sources/central/CentralDriveSource.js";
import {
  loadCentralManifest,
  manifestItemsToImported,
  type CentralManifest,
} from "../../sources/central/CentralManifestSource.js";

/**
 * Central accessories — manufacturer/brand only; never auto-associates TCG.
 * Hybrid: versioned manifest + optional Drive API (feature-flag).
 */
export class CentralAccessoriesProvider extends BaseProductCatalogProvider {
  readonly providerId: string = "central-accessories";
  readonly category: ProductCategory = ProductCategory.SLEEVES;

  constructor(
    private readonly categoryFilter?: ProductCategory,
    private readonly loadManifest: () => CentralManifest = loadCentralManifest,
  ) {
    super();
  }

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    const manifest = this.loadManifest();
    const items = manifestItemsToImported(manifest, this.categoryFilter);

    if (isProductCatalogFlagOn(FF_CENTRAL_DRIVE_API)) {
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim();
      if (apiKey) {
        try {
          const driveItems = await listCentralDriveImages(new GoogleDriveListClient(apiKey));
          const asManifestItems = driveImagesToManifestItems(driveItems);
          const driveDto = manifestItemsToImported(
            {
              version: manifest.version,
              manufacturer: manifest.manufacturer,
              brand: manifest.brand,
              items: asManifestItems,
            },
            this.categoryFilter,
          );
          const bySku = new Map(items.map((i) => [i.sku ?? i.providerRef, i]));
          for (const d of driveDto) {
            const key = d.sku ?? d.providerRef;
            if (!bySku.has(key)) bySku.set(key, d);
          }
          const merged = [...bySku.values()];
          return this.ok(merged);
        } catch (e) {
          return {
            ok: true,
            count: items.length,
            items,
            errors: [`central_drive:${e instanceof Error ? e.message : String(e)}`],
          };
        }
      }
    }

    return this.ok(items);
  }
}

export class CentralSleevesProvider extends CentralAccessoriesProvider {
  override readonly providerId = "central-sleeves";
  override readonly category = ProductCategory.SLEEVES;
  constructor() {
    super(ProductCategory.SLEEVES);
  }
}

export class CentralDeckBoxProvider extends CentralAccessoriesProvider {
  override readonly providerId = "central-deckboxes";
  override readonly category = ProductCategory.DECK_BOX;
  constructor() {
    super(ProductCategory.DECK_BOX);
  }
}

export class CentralBinderProvider extends CentralAccessoriesProvider {
  override readonly providerId = "central-binders";
  override readonly category = ProductCategory.BINDER;
  constructor() {
    super(ProductCategory.BINDER);
  }
}

export class CentralPlaymatProvider extends CentralAccessoriesProvider {
  override readonly providerId = "central-playmats";
  override readonly category = ProductCategory.PLAYMAT;
  constructor() {
    super(ProductCategory.PLAYMAT);
  }
}

export class CentralCountersProvider extends CentralAccessoriesProvider {
  override readonly providerId = "central-counters";
  override readonly category = ProductCategory.COUNTERS;
  constructor() {
    super(ProductCategory.COUNTERS);
  }
}
