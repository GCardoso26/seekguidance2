/**
 * Shopify /products.json accessory adapter (docs/ACCESSORY_IMAGE_PROVIDERS.md §3.1 / §5.2).
 * Live packshots from brand stores — replaces placeholder cdn.judgetcg.example manifests.
 */
import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../../providers/BaseProductCatalogProvider.js";
import type {
  ProductCatalogSyncContext,
  ProductCatalogSyncResult,
} from "../../providers/ProductCatalogProvider.js";
import { fetchWithTransientRetry } from "../../providers/fetchWithTransientRetry.js";
import { ACCESSORY_TYPE_TO_SUBCATEGORY } from "./accessoryTaxonomy.js";

type ShopifyImage = { src?: string };
type ShopifyVariant = { sku?: string; barcode?: string; title?: string };
type ShopifyProduct = {
  id?: number;
  title?: string;
  product_type?: string;
  handle?: string;
  tags?: string;
  images?: ShopifyImage[];
  variants?: ShopifyVariant[];
};

const TYPE_HINTS: Array<{ match: RegExp; category: ProductCategory; accessoryType: keyof typeof ACCESSORY_TYPE_TO_SUBCATEGORY }> = [
  { match: /perfect\s*fit|inner\s*sleeve/i, category: ProductCategory.SLEEVES, accessoryType: "perfect_fit" },
  { match: /outer\s*sleeve/i, category: ProductCategory.SLEEVES, accessoryType: "outer_sleeves" },
  { match: /deck\s*protector|sleeve|sleeves/i, category: ProductCategory.SLEEVES, accessoryType: "sleeves" },
  { match: /deck\s*box|deckbox|deck\s*case|storage\s*box/i, category: ProductCategory.DECK_BOX, accessoryType: "deck_box" },
  { match: /binder|portfolio/i, category: ProductCategory.BINDER, accessoryType: "binder" },
  { match: /playmat|play\s*mat/i, category: ProductCategory.PLAYMAT, accessoryType: "playmat" },
  { match: /\bdice\b|d6|d20/i, category: ProductCategory.DICE, accessoryType: "dice" },
  { match: /counter|life\s*pad|life\s*counter|token/i, category: ProductCategory.COUNTERS, accessoryType: "counters" },
];

export function mapShopifyTypeToCategory(
  productType: string,
  title: string,
): { category: ProductCategory; accessoryType: keyof typeof ACCESSORY_TYPE_TO_SUBCATEGORY } | null {
  const hay = `${productType} ${title}`.trim();
  if (!hay) return null;
  // Skip apparel / non-accessory noise
  if (/\b(apparel|shirt|hoodie|hat|sticker|pin|mug|poster)\b/i.test(hay)) return null;
  for (const hint of TYPE_HINTS) {
    if (hint.match.test(hay)) return { category: hint.category, accessoryType: hint.accessoryType };
  }
  return null;
}

export function createShopifyAccessoryProvider(opts: {
  providerId: string;
  host: string;
  brandName: string;
  manufacturerName?: string;
  category: ProductCategory;
}): new () => BaseProductCatalogProvider {
  return class extends BaseProductCatalogProvider {
    readonly providerId = opts.providerId;
    readonly category = opts.category;

    override async syncProducts(
      ctx: ProductCatalogSyncContext,
    ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
      void ctx;
      const maxPages = Number(process.env.SHOPIFY_ACCESSORY_MAX_PAGES ?? "8");
      const items: ImportedProductDTO[] = [];
      const errors: string[] = [];

      for (let page = 1; page <= maxPages; page++) {
        const url = `https://${opts.host}/products.json?limit=250&page=${page}`;
        const res = await fetchWithTransientRetry(
          url,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "JudgeTCG/product-catalog (https://judgetcg.com.br)",
            },
          },
          { attempts: 3, baseDelayMs: 300 },
        );
        if (!res.ok) {
          errors.push(`shopify_http_${res.status}:${opts.host}:p${page}`);
          break;
        }
        const body = (await res.json()) as { products?: ShopifyProduct[] };
        const products = body.products ?? [];
        if (!products.length) break;

        for (const p of products) {
          const title = String(p.title || "").trim();
          const handle = String(p.handle || p.id || "").trim();
          if (!title || !handle) continue;
          const mapped = mapShopifyTypeToCategory(String(p.product_type || ""), title);
          if (!mapped || mapped.category !== opts.category) continue;
          const images = (p.images ?? [])
            .map((im) => String(im.src || "").trim())
            .filter((src) => src.startsWith("https://"));
          if (!images.length) continue;

          const sku = String(p.variants?.[0]?.sku || `${opts.providerId}:${handle}`).trim();
          const ean = p.variants?.[0]?.barcode ? String(p.variants[0].barcode) : undefined;
          const subcategory = ACCESSORY_TYPE_TO_SUBCATEGORY[mapped.accessoryType] ?? "STANDARD_MATTE";

          items.push({
            providerRef: `${opts.providerId}:${handle}`,
            manufacturerName: opts.manufacturerName ?? opts.brandName,
            brandName: opts.brandName,
            category: opts.category,
            subcategory,
            sku,
            ean,
            titlePt: title,
            titleEn: title,
            gameCodes: [],
            variants: [
              {
                providerRef: `${opts.providerId}:${handle}:default`,
                variantName: p.variants?.[0]?.title || "Padrão",
                sku,
                ean,
                attributes: {
                  accessoryType: mapped.accessoryType,
                  shopifyHandle: handle,
                  productType: String(p.product_type || ""),
                },
                images: images.map((sourceUrl, i) => ({
                  sourceUrl,
                  isPrimary: i === 0,
                  sortOrder: i,
                })),
              },
            ],
          });
        }
      }

      if (!items.length && errors.length) {
        return { ok: false, count: 0, items: [], errors };
      }
      return { ok: true, count: items.length, items, errors: errors.length ? errors : undefined };
    }
  };
}
