import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";
import { extractLorcanaSetsPayload, normalizeLorcanaSetRow } from "./lorcanaSetNormalize.js";
import { packshotUrlForSku } from "./lorcanaPackshots.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

type SeedFile = {
  items?: Array<Record<string, unknown>>;
};

/** Curated sets absent from lorcana-api — API Set_ID always wins on collision. */
export function loadLorcanaSealedSetSeed(): Array<Record<string, unknown>> {
  try {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "../../sources/lorcana/sealed-sets.seed.json"), "utf8"),
    ) as SeedFile;
    return Array.isArray(raw.items) ? raw.items : [];
  } catch {
    return [];
  }
}

export function mergeLorcanaSetsWithSeed(
  apiSets: Array<Record<string, unknown>>,
  seedSets: Array<Record<string, unknown>> = loadLorcanaSealedSetSeed(),
): Array<Record<string, unknown>> {
  const byCode = new Map<string, Record<string, unknown>>();
  for (const row of seedSets) {
    const code = String(row.Set_ID ?? row.setCode ?? row.code ?? "")
      .trim()
      .toUpperCase();
    if (!code) continue;
    byCode.set(code, row);
  }
  for (const row of apiSets) {
    const code = String(row.Set_ID ?? row.setCode ?? row.code ?? row.id ?? "")
      .trim()
      .toUpperCase();
    if (!code) continue;
    byCode.set(code, row);
  }
  return [...byCode.values()];
}

/**
 * Lorcana sealed — Priority 1: public lorcana-api set metadata + curated seed gap-fill.
 * Packshots: curated Ravensburger CDN URLs merged by SKU (lorcana-api has no images).
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

    sets = mergeLorcanaSetsWithSeed(sets);

    const items: ImportedProductDTO[] = [];
    for (const set of sets) {
      const norm = normalizeLorcanaSetRow(set);
      if (!norm) continue;
      const { code, name, releaseDate, image } = norm;
      const boxSku = `LOR-BOX-${code.toUpperCase()}`;
      const packSku = `LOR-PACK-${code.toUpperCase()}`;
      const troveSku = `LOR-TROVE-${code.toUpperCase()}`;
      // Prefer curated official packshot; fall back to API logo/icon if ever present (BOX/TROVE only).
      const boxImage = packshotUrlForSku(boxSku) ?? image;
      const troveImage = packshotUrlForSku(troveSku) ?? image;
      // ADR-016: pack ≠ box; only curated LOR-PACK-* URLs (no logo / box-art reuse).
      const packImage = packshotUrlForSku(packSku);
      items.push({
        providerRef: `lorcana-set-${code}-box`,
        manufacturerName: "Ravensburger",
        brandName: "Disney Lorcana",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BOOSTER_BOX",
        sku: boxSku,
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
            sku: boxSku,
            images: boxImage ? [{ sourceUrl: boxImage, isPrimary: true }] : [],
          },
        ],
      });
      items.push({
        providerRef: `lorcana-set-${code}-pack`,
        manufacturerName: "Ravensburger",
        brandName: "Disney Lorcana",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BOOSTER_PACK",
        sku: packSku,
        titlePt: `Booster Pack — ${name}`,
        titleEn: `Booster Pack — ${name}`,
        game: "LORCANA",
        gameCodes: ["LORCANA"],
        collectionName: name,
        releaseDate,
        variants: [
          {
            providerRef: `lorcana-set-${code}-pack-default`,
            variantName: "Padrão",
            sku: packSku,
            images: packImage ? [{ sourceUrl: packImage, isPrimary: true }] : [],
          },
        ],
      });
      items.push({
        providerRef: `lorcana-set-${code}-trove`,
        manufacturerName: "Ravensburger",
        brandName: "Disney Lorcana",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "ILLUMINEERS_TROVE",
        sku: troveSku,
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
            sku: troveSku,
            images: troveImage ? [{ sourceUrl: troveImage, isPrimary: true, sortOrder: 0 }] : [],
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
