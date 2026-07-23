import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type { ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider.js";

const SCRYFALL_UA = "JudgeTCG/product-catalog (https://judgetcg.com.br; ops@judgetcg.com.br)";

async function fetchScryfallSets(): Promise<Response> {
  return fetch("https://api.scryfall.com/sets", {
    headers: {
      Accept: "application/json",
      // Scryfall requires a descriptive User-Agent; bare fetch often yields HTTP 400.
      "User-Agent": SCRYFALL_UA,
    },
  });
}

/** Scryfall — produtos selados MTG (sets tipo booster/box). Imagem = icon_svg_uri (símbolo), não packshot. */
export class ScryfallSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "scryfall-sealed";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    void ctx;
    let res = await fetchScryfallSets();
    if (!res.ok && (res.status === 400 || res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 250));
      res = await fetchScryfallSets();
    }
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
      const icon = set.icon_svg_uri ? String(set.icon_svg_uri) : undefined;
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
        collectionName: name,
        releaseDate: set.released_at ? String(set.released_at) : undefined,
        variants: [
          {
            providerRef: `scryfall-set-${code}-box-default`,
            variantName: "Padrão",
            sku: `MTG-BOX-${code.toUpperCase()}`,
            images: icon ? [{ sourceUrl: icon, isPrimary: true }] : [],
          },
        ],
      });
      items.push({
        providerRef: `scryfall-set-${code}-bundle`,
        manufacturerName: "Wizards of the Coast",
        brandName: "Magic: The Gathering",
        category: ProductCategory.SEALED_PRODUCT,
        subcategory: "BUNDLE",
        sku: `MTG-BUNDLE-${code.toUpperCase()}`,
        titlePt: `Bundle — ${name} (Magic)`,
        titleEn: `Bundle — ${name}`,
        game: "MTG",
        gameCodes: ["MTG"],
        collectionName: name,
        releaseDate: set.released_at ? String(set.released_at) : undefined,
        variants: [
          {
            providerRef: `scryfall-set-${code}-bundle-default`,
            variantName: "Padrão",
            sku: `MTG-BUNDLE-${code.toUpperCase()}`,
            images: icon ? [{ sourceUrl: icon, isPrimary: true }] : [],
          },
        ],
      });
    }
    return this.ok(items);
  }
}
