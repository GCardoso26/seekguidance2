import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";
import { extractLorcanaSetsPayload, normalizeLorcanaSetRow } from "./lorcanaSetNormalize.js";

/**
 * Lorcana sealed — Priority 1: public lorcana-api set metadata.
 * Note: lorcana-api bulk/sets has no packshot URLs (Set_ID/Name only); products still upsert.
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
      "https://api.lorcana-api.com/sets/all",
    ].filter(Boolean) as string[];

    let sets: Array<Record<string, unknown>> = [];
    const errors: string[] = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "JudgeTCG/product-catalog (https://judgetcg.com.br)",
          },
        });
        if (!res.ok) {
          errors.push(`lorcana_http_${res.status}:${url}`);
          continue;
        }
        const body = (await res.json()) as unknown;
        sets = extractLorcanaSetsPayload(body);
        if (sets.length) break;
        errors.push(`lorcana_empty_payload:${url}`);
      } catch (e) {
        errors.push(`lorcana_fetch:${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const items: ImportedProductDTO[] = [];
    for (const set of sets) {
      const norm = normalizeLorcanaSetRow(set);
      if (!norm) continue;
      const { code, name, releaseDate, image } = norm;
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
        releaseDate,
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
        releaseDate,
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

    if (!items.length && errors.length) {
      return { ok: false, count: 0, items: [], errors };
    }

    return { ok: true, count: items.length, items, errors: errors.length ? errors : undefined };
  }
}
