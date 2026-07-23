import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../../providers/BaseProductCatalogProvider.js";
import type {
  ProductCatalogSyncContext,
  ProductCatalogSyncResult,
} from "../../providers/ProductCatalogProvider.js";
import { mapManufacturerManifest } from "./mapManifest.js";
import type { ManufacturerManifest } from "./types.js";

export function loadManufacturerManifest(moduleUrl: string, file = "manifest.json"): ManufacturerManifest {
  const dir = dirname(fileURLToPath(moduleUrl));
  return JSON.parse(readFileSync(join(dir, file), "utf8")) as ManufacturerManifest;
}

/** Concrete manufacturer provider — avoids abstract-field inheritance issues with factories. */
export class ManufacturerCatalogProvider extends BaseProductCatalogProvider {
  readonly providerId: string;
  readonly category: ProductCategory;

  constructor(
    providerId: string,
    category: ProductCategory,
    private readonly moduleUrl: string,
    private readonly manifestFile = "manifest.json",
  ) {
    super();
    this.providerId = providerId;
    this.category = category;
  }

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    const manifest = loadManufacturerManifest(this.moduleUrl, this.manifestFile);
    return this.ok(mapManufacturerManifest(manifest, this.category));
  }
}

export function createManufacturerProvider(opts: {
  providerId: string;
  category: ProductCategory;
  moduleUrl: string;
  manifestFile?: string;
}): new () => ManufacturerCatalogProvider {
  return class extends ManufacturerCatalogProvider {
    constructor() {
      super(opts.providerId, opts.category, opts.moduleUrl, opts.manifestFile);
    }
  };
}
