/**
 * TCGCSV → TCGplayer CDN sealed packshots (docs/SEALED_PRODUCT_IMAGE_PROVIDERS.md).
 * ADR-016: verified HTTPS packshots only — never set logo/icon. Trust = distributor_feed
 * so curated official manifests still win over this source.
 *
 * Budget is per-game so MTG cannot starve Pokémon/YGO/… under a global product cap.
 */
import { ProductCategory } from "../../domain/enums.js";
import type { ImportedProductDTO } from "../../domain/models.js";
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider.js";
import type {
  ProductCatalogSyncContext,
  ProductCatalogSyncResult,
} from "../ProductCatalogProvider.js";
import { fetchWithTransientRetry } from "../fetchWithTransientRetry.js";

const TCGCSV_BASE = "https://tcgcsv.com/tcgplayer";
const TCGCSV_UA = "JudgeTCG/product-catalog (https://judgetcg.com.br)";

/** Validated category map — excludes ADR-016 denylist (SWU/Vanguard/UArena). */
export const TCGCSV_CATEGORY_BY_GAME: Record<string, number> = {
  MTG: 1,
  YUGIOH: 2,
  POKEMON: 3,
  FAB: 62,
  DIGIMON: 63,
  ONE_PIECE: 68,
  LORCANA: 71,
  SORCERY: 77,
  DBFW: 80,
  GUNDAM: 86,
  RIFTBOUND: 89,
};

const SEALED_KEYWORDS = [
  "booster box",
  "booster pack",
  "display",
  "bundle",
  "elite trainer",
  "starter deck",
  "structure deck",
  "preconstructed",
  "commander deck",
  "deck set",
  "gift box",
  "gift",
  "collection",
  "case",
  "tin",
  "blister",
  "prerelease",
  "trove",
  "illumineer",
] as const;

type TcgCsvGroup = {
  groupId?: number;
  name?: string;
  abbreviation?: string;
  publishedOn?: string;
};

type TcgCsvProduct = {
  productId?: number;
  name?: string;
  cleanName?: string;
  imageUrl?: string;
  extendedData?: Array<{ name?: string; value?: string }>;
};

function cdnUrl(productId: number): string {
  return `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_in_1000x1000.jpg`;
}

export function classifySealedSubcategory(nameLower: string): string {
  if (nameLower.includes("elite trainer") || nameLower.includes(" etb")) return "ELITE_TRAINER_BOX";
  if (nameLower.includes("trove") || nameLower.includes("illumineer")) return "TROVE";
  if (nameLower.includes("commander deck")) return "COMMANDER_DECK";
  if (nameLower.includes("structure deck")) return "STRUCTURE_DECK";
  if (nameLower.includes("starter deck") || nameLower.includes("deck set") || nameLower.includes("preconstructed")) {
    return "STARTER_DECK";
  }
  if (nameLower.includes("prerelease")) return "PRERELEASE_KIT";
  if (nameLower.includes("gift")) return "GIFT_BOX";
  if (nameLower.includes("bundle") || nameLower.includes("collection")) return "BUNDLE";
  if (nameLower.includes("booster pack") || (nameLower.includes(" pack") && !nameLower.includes("box"))) {
    return "BOOSTER_PACK";
  }
  if (nameLower.includes("booster box") || nameLower.includes("display") || nameLower.includes("case")) {
    return "BOOSTER_BOX";
  }
  if (nameLower.includes("tin") || nameLower.includes("blister")) return "COLLECTION_BOX";
  return "BOOSTER_BOX";
}

export function isSealedTcgCsvProduct(name: string): boolean {
  const n = name.toLowerCase();
  return SEALED_KEYWORDS.some((k) => n.includes(k));
}

export function resolveTcgCsvSealedCaps(mode: ProductCatalogSyncContext["mode"]): {
  maxGroupsPerGame: number;
  maxProductsPerGame: number;
  maxProductsGlobal: number;
} {
  const isFull = mode === "full";
  return {
    maxGroupsPerGame: Number(
      process.env.TCGCSV_SEALED_MAX_GROUPS_PER_GAME ??
        process.env.TCGCSV_SEALED_MAX_GROUPS ??
        (isFull ? "80" : "15"),
    ),
    maxProductsPerGame: Number(
      process.env.TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME ?? (isFull ? "500" : "80"),
    ),
    maxProductsGlobal: Number(
      process.env.TCGCSV_SEALED_MAX_PRODUCTS ?? (isFull ? "6000" : "600"),
    ),
  };
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": TCGCSV_UA,
  };
  const key = process.env.JUSTTCG_API_KEY?.trim();
  if (key) h["x-api-key"] = key;
  return h;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetchWithTransientRetry(url, { headers: headers() }, { attempts: 3, baseDelayMs: 400 });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function skuFor(game: string, subcategory: string, groupId: number, productId: number): string {
  const sub = subcategory.replace(/_/g, "-");
  return `${game}-${sub}-G${groupId}-${productId}`;
}

export class TcgCsvSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "tcgcsv-sealed";
  readonly category = ProductCategory.SEALED_PRODUCT;

  override async syncProducts(
    ctx: ProductCatalogSyncContext,
  ): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    const { maxGroupsPerGame, maxProductsPerGame, maxProductsGlobal } = resolveTcgCsvSealedCaps(
      ctx.mode,
    );
    const items: ImportedProductDTO[] = [];
    const errors: string[] = [];

    for (const [game, categoryId] of Object.entries(TCGCSV_CATEGORY_BY_GAME)) {
      if (items.length >= maxProductsGlobal) break;

      const groupsBody = await getJson<{ results?: TcgCsvGroup[] }>(
        `${TCGCSV_BASE}/${categoryId}/groups`,
      );
      if (!groupsBody?.results?.length) {
        errors.push(`tcgcsv_http_groups_empty:${game}:${categoryId}`);
        continue;
      }

      const groups = [...groupsBody.results]
        .filter((g) => g.groupId != null)
        .sort((a, b) => String(b.publishedOn ?? "").localeCompare(String(a.publishedOn ?? "")))
        .slice(0, Math.max(1, maxGroupsPerGame));

      let gameCount = 0;

      for (const g of groups) {
        if (items.length >= maxProductsGlobal || gameCount >= maxProductsPerGame) break;
        const groupId = Number(g.groupId);
        const setCode = String(g.abbreviation || groupId).toUpperCase();
        const prodsBody = await getJson<{ results?: TcgCsvProduct[] }>(
          `${TCGCSV_BASE}/${categoryId}/${groupId}/products`,
        );
        if (!prodsBody?.results) {
          errors.push(`tcgcsv_http_products:${game}:${groupId}`);
          continue;
        }

        for (const p of prodsBody.results) {
          if (items.length >= maxProductsGlobal || gameCount >= maxProductsPerGame) break;
          const productId = Number(p.productId);
          const name = String(p.name || p.cleanName || "").trim();
          if (!productId || !name || !isSealedTcgCsvProduct(name)) continue;
          // Prefer CDN size suffix (bare product URL returns 403).
          if (!p.imageUrl) continue;

          const subcategory = classifySealedSubcategory(name.toLowerCase());
          const sku = skuFor(game, subcategory, groupId, productId);
          items.push({
            providerRef: `tcgcsv:${categoryId}:${productId}`,
            manufacturerName: "TCGplayer Catalog",
            brandName: game,
            category: ProductCategory.SEALED_PRODUCT,
            subcategory,
            sku,
            titlePt: name,
            titleEn: name,
            game,
            gameCodes: [game],
            collectionName: String(g.name || setCode),
            releaseDate: g.publishedOn,
            officialMetadata: {
              game,
              expansion: String(g.name || setCode),
              sku,
              productFamily: subcategory,
            },
            variants: [
              {
                providerRef: `tcgcsv:${productId}`,
                variantName: "Padrão",
                sku,
                images: [{ sourceUrl: cdnUrl(productId), isPrimary: true, sortOrder: 0 }],
              },
            ],
          });
          gameCount += 1;
        }
      }
    }

    if (!items.length && errors.length) {
      return { ok: false, count: 0, items: [], errors };
    }
    return { ok: true, count: items.length, items, errors: errors.length ? errors : undefined };
  }
}
