import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import {
  ACCESSORY_TYPE_TO_CATEGORY,
  ACCESSORY_TYPE_TO_SUBCATEGORY,
} from "./accessoryTaxonomy.js";
import type { ManufacturerManifest } from "./types.js";

/** Map manufacturer manifest → Product Catalog DTOs (never sets game). */
export function mapManufacturerManifest(
  manifest: ManufacturerManifest,
  categoryFilter?: ProductCategory,
): ImportedProductDTO[] {
  const out: ImportedProductDTO[] = [];
  for (const item of manifest.items) {
    const category = ACCESSORY_TYPE_TO_CATEGORY[item.accessoryType] as ProductCategory;
    if (categoryFilter && category !== categoryFilter) continue;
    const subcategory = item.subcategory ?? ACCESSORY_TYPE_TO_SUBCATEGORY[item.accessoryType];
    out.push({
      providerRef: `${manifest.manufacturerId}:${item.sku}`,
      manufacturerName: manifest.manufacturer,
      brandName: manifest.brand,
      category,
      subcategory,
      sku: item.sku,
      ean: item.ean ?? item.upc,
      titlePt: item.titlePt,
      titleEn: item.titleEn,
      game: undefined,
      gameCodes: [],
      variants: [
        {
          providerRef: `${manifest.manufacturerId}:${item.sku}:default`,
          variantName: "Padrão",
          sku: item.sku,
          ean: item.ean ?? item.upc,
          attributes: {
            accessoryType: item.accessoryType,
            aliases: (item.aliases ?? []).join("|"),
          },
          images: item.images.map((img, idx) => ({
            sourceUrl: img.sourceUrl,
            isPrimary: img.isPrimary ?? (img.role === "packshot" && idx === 0),
            sortOrder: idx,
          })),
        },
      ],
    });
  }
  return out;
}
