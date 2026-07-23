import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";

/**
 * Lorcana sealed — Priority 1: public lorcana-api / cards.json set metadata when available.
 * Falls back to empty set list gracefully.
 */
export class LorcanaJsonSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "lorcana-json-sealed";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    const urls = [
      process.env.LORCANA_SETS_URL?.trim(),
      "https://api.lorcana-api.com/bulk/sets",
      "https://lorcanajson.org/sets.json",
    ].filter(Boolean) as string[];

    let sets: Array<Record<string, unknown>> = [];
    const errors: string[] = [];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          errors.push(`lorcana_http_${res.status}:${url}`);
          continue;
        }
        const body = (await res.json()) as unknown;
        if (Array.isArray(body)) sets = body as Array<Record<string, unknown>>;
        else if (body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)) {
          sets = (body as { data: Array<Record<string, unknown>> }).data;
        } else if (body && typeof body === "object" && Array.isArray((body as { sets?: unknown }).sets)) {
          sets = (body as { sets: Array<Record<string, unknown>> }).sets;
        }
        if (sets.length) break;
      } catch (e) {
        errors.push(`lorcana_fetch:${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const items: ImportedProductDTO[] = [];
    for (const set of sets) {
      const code = String(set.code ?? set.id ?? set.setCode ?? "");
      const name = String(set.name ?? set.setName ?? "");
      if (!code || !name) continue;
      const image =
        (set.icon as string | undefined) ||
        (set.logo as string | undefined) ||
        (set.image as string | undefined) ||
        (set.images as { logo?: string } | undefined)?.logo;
      const sku = `LOR-BOX-${code.toUpperCase()}`;
      items.push({
        providerRef: `lorcana-set-${code}-box`,
        manufacturerName: "Ravensburger",
        brandName: "Disney Lorcana",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BOOSTER_BOX",
        sku,
        titlePt: `Booster Box — ${name}`,
        titleEn: `Booster Box — ${name}`,
        game: "LORCANA",
        gameCodes: ["LORCANA"],
        collectionName: name,
        releaseDate: set.releaseDate ? String(set.releaseDate) : undefined,
        variants: [
          {
            providerRef: `lorcana-set-${code}-box-default`,
            variantName: "Padrão",
            sku,
            images: image ? [{ sourceUrl: image, isPrimary: true }] : [],
          },
        ],
      });
      items.push({
        providerRef: `lorcana-set-${code}-trove`,
        manufacturerName: "Ravensburger",
        brandName: "Disney Lorcana",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "ILLUMINEERS_TROVE",
        sku: `LOR-TROVE-${code.toUpperCase()}`,
        titlePt: `Illumineer's Trove — ${name}`,
        titleEn: `Illumineer's Trove — ${name}`,
        game: "LORCANA",
        gameCodes: ["LORCANA"],
        collectionName: name,
        variants: [
          {
            providerRef: `lorcana-set-${code}-trove-default`,
            variantName: "Padrão",
            sku: `LOR-TROVE-${code.toUpperCase()}`,
            images: image ? [{ sourceUrl: image, isPrimary: true, sortOrder: 0 }] : [],
          },
        ],
      });
    }

    return { ok: true, count: items.length, items, errors: errors.length ? errors : undefined };
  }
}
