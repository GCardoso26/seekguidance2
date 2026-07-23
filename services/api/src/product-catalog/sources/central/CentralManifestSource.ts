import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ImportedImageDTO, ImportedProductDTO } from "../../domain/models.js";
import { ProductCategory } from "../../domain/enums.js";

export type CentralImageRole = "packshot" | "hero" | "banner" | "logo" | "marketing" | "lifestyle";

export interface CentralManifestImage {
  role: CentralImageRole;
  sourceUrl: string;
  isPrimary?: boolean;
}

export interface CentralManifestItem {
  sku: string;
  titlePt: string;
  titleEn?: string;
  category: string;
  subcategory: string;
  accessoryType: string;
  ean?: string;
  images: CentralManifestImage[];
}

export interface CentralManifest {
  version: number;
  manufacturer: string;
  brand: string;
  folderId?: string;
  items: CentralManifestItem[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadCentralManifest(pathOverride?: string): CentralManifest {
  const path = pathOverride ?? join(__dirname, "manifest.v1.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as CentralManifest;
  if (!Array.isArray(raw.items)) throw new Error("central_manifest_invalid");
  return raw;
}

export function manifestItemsToImported(
  manifest: CentralManifest,
  categoryFilter?: ProductCategory,
): ImportedProductDTO[] {
  const out: ImportedProductDTO[] = [];
  for (const item of manifest.items) {
    if (categoryFilter && item.category !== categoryFilter) continue;
    const images: ImportedImageDTO[] = item.images.map((img, idx) => ({
      sourceUrl: img.sourceUrl,
      isPrimary: img.isPrimary ?? (img.role === "packshot" && idx === 0),
      sortOrder: idx,
    }));
    out.push({
      providerRef: `central:${item.sku}`,
      manufacturerName: manifest.manufacturer,
      brandName: manifest.brand,
      category: item.category as ProductCategory,
      subcategory: item.subcategory,
      sku: item.sku,
      ean: item.ean,
      titlePt: item.titlePt,
      titleEn: item.titleEn,
      // Acessórios NUNCA associam TCG automaticamente
      game: undefined,
      gameCodes: [],
      variants: [
        {
          providerRef: `central:${item.sku}:default`,
          variantName: "Padrão",
          sku: item.sku,
          ean: item.ean,
          attributes: { accessoryType: item.accessoryType },
          images,
        },
      ],
    });
  }
  return out;
}
