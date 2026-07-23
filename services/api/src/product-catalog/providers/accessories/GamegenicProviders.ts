import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";

interface GamegenicManifest {
  manufacturer: string;
  brand: string;
  items: Array<{
    sku: string;
    titlePt: string;
    titleEn?: string;
    category: string;
    subcategory: string;
    accessoryType: string;
    images: Array<{ role: string; sourceUrl: string; isPrimary?: boolean }>;
  }>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadManifest(): GamegenicManifest {
  return JSON.parse(readFileSync(join(__dirname, "../../sources/gamegenic/manifest.v1.json"), "utf8"));
}

function toDto(manifest: GamegenicManifest, category: ProductCategory): ImportedProductDTO[] {
  return manifest.items
    .filter((i) => i.category === category)
    .map((item) => ({
      providerRef: `gamegenic:${item.sku}`,
      manufacturerName: manifest.manufacturer,
      brandName: manifest.brand,
      category,
      subcategory: item.subcategory,
      sku: item.sku,
      titlePt: item.titlePt,
      titleEn: item.titleEn,
      gameCodes: [],
      variants: [
        {
          providerRef: `gamegenic:${item.sku}:default`,
          variantName: "Padrão",
          sku: item.sku,
          attributes: { accessoryType: item.accessoryType },
          images: item.images.map((img, idx) => ({
            sourceUrl: img.sourceUrl,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: idx,
          })),
        },
      ],
    }));
}

/** Official Gamegenic resources — packshots / lifestyle / logos from curated official URLs. */
export class GamegenicSleevesProvider extends BaseProductCatalogProvider {
  readonly providerId = "gamegenic-sleeves";
  readonly category = ProductCategory.SLEEVES;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    return this.ok(toDto(loadManifest(), ProductCategory.SLEEVES));
  }
}

export class GamegenicDeckBoxProvider extends BaseProductCatalogProvider {
  readonly providerId = "gamegenic-deckboxes";
  readonly category = ProductCategory.DECK_BOX;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    return this.ok(toDto(loadManifest(), ProductCategory.DECK_BOX));
  }
}

export class GamegenicPlaymatProvider extends BaseProductCatalogProvider {
  readonly providerId = "gamegenic-playmats";
  readonly category = ProductCategory.PLAYMAT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    return this.ok(toDto(loadManifest(), ProductCategory.PLAYMAT));
  }
}
