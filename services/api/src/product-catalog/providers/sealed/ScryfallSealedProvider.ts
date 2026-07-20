import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";

/** Scryfall — produtos selados MTG (sets tipo booster/box). */
export class ScryfallSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "scryfall-sealed";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    const res = await fetch("https://api.scryfall.com/sets");
    if (!res.ok) {
      return { ok: false, count: 0, errors: [`scryfall_http_${res.status}`] };
    }
    const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const items: ImportedProductDTO[] = [];
    for (const set of body.data ?? []) {
      const setType = String(set.set_type ?? "");
      if (!["expansion", "core", "masters", "draft_innovation", "commander"].includes(setType)) {
        continue;
      }
      const code = String(set.code ?? "");
      const name = String(set.name ?? "");
      if (!code || !name) continue;
      const titlePt = `Booster Box — ${name} (Magic)`;
      items.push({
        providerRef: `scryfall-set-${code}-box`,
        manufacturerName: "Wizards of the Coast",
        brandName: "Magic: The Gathering",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BOOSTER_BOX",
        sku: `MTG-BOX-${code.toUpperCase()}`,
        titlePt,
        titleEn: `Booster Box — ${name}`,
        description: `Produto selado Magic — set ${code}.`,
        game: "MTG",
        gameCodes: ["MTG"],
        releaseDate: set.released_at ? String(set.released_at) : undefined,
        variants: [
          {
            providerRef: `scryfall-set-${code}-box-default`,
            variantName: "Padrão",
            images: set.icon_svg_uri ? [{ sourceUrl: String(set.icon_svg_uri), isPrimary: true }] : [],
          },
        ],
      });
    }
    return this.ok(items);
  }
}
