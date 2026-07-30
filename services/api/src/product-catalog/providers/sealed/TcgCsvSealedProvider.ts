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

/**
 * Whole-word phrases. Substring matching used to leak singles into the catalog:
 * "tin" matched Destiny/Sentinel/Tintagel, "case" matched every (Showcase),
 * and bare "gift" matched Gift of the Frog.
 */
const SEALED_PHRASES = [
  "booster box",
  "booster boxes",
  "booster pack",
  "booster packs",
  "booster case",
  "booster display",
  "booster bundle",
  "display box",
  "display case",
  "case of",
  "sealed case",
  "bundle",
  "elite trainer box",
  "elite trainer",
  "starter deck",
  "starter set",
  "structure deck",
  "preconstructed",
  "commander deck",
  "deck set",
  "deck box",
  "gift box",
  "gift set",
  "gift bundle",
  "gift collection",
  "collection box",
  "collector box",
  "collection",
  "tin",
  "tins",
  "blister",
  "prerelease",
  "illumineer",
] as const;

/**
 * extendedData keys that only a single card carries. TCGCSV ships them per game;
 * sealed rows come with at most a Description.
 */
const CARD_EXTENDED_DATA_KEYS = new Set(["rarity", "number", "card type", "cardtype"]);

const phraseCache = new Map<string, RegExp>();

function phraseRegex(phrase: string): RegExp {
  let re = phraseCache.get(phrase);
  if (!re) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    re = new RegExp(`\\b${escaped}\\b`, "i");
    phraseCache.set(phrase, re);
  }
  return re;
}

function matchesAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((p) => phraseRegex(p).test(text));
}

/**
 * "Gateway Case", "Draft Night Case", "Armory Deck: Malice Case" são caixas fechadas
 * de display. O artigo/preposição antes de "case" denuncia prosa de nome de carta
 * ("Judy Hopps - On the Case"), não tipo de produto.
 */
const TRAILING_CASE = /\bcase\s*$/i;
const PROSE_BEFORE_CASE = /\b(the|a|an|in|on|of|my|your|his|her|their|this|that|any|every)\s+case\s*$/i;

/**
 * "display" é tipo de produto quando fecha o nome ("Booster Display", "Deck Display")
 * ou qualifica caixa. No meio da frase é nome de carta: "Display of Artistry (Blue)".
 */
const TRAILING_DISPLAY = /\bdisplay\s*$/i;

/** Número de carta (33/95, BT12-050) nunca aparece em produto selado. */
const CARD_NUMBER = /\b\d+\s*\/\s*\d+\b/;

const NON_PRODUCT_PREFIXES = ["code card"] as const;

/**
 * Parêntese final é qualificador de impressão, não tipo de produto:
 * "Fireball (Preconstructed Deck)" e "Snorlax - 33/95 (Prerelease)" são cartas avulsas,
 * enquanto "Starter Deck (Amber & Ruby)" tem o termo fora do parêntese.
 */
function stripParentheticals(text: string): string {
  return text.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

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
  if (matchesAny(nameLower, ["elite trainer", "etb"])) return "ELITE_TRAINER_BOX";
  if (matchesAny(nameLower, ["trove", "illumineer"])) return "TROVE";
  if (matchesAny(nameLower, ["commander deck"])) return "COMMANDER_DECK";
  if (matchesAny(nameLower, ["structure deck"])) return "STRUCTURE_DECK";
  if (matchesAny(nameLower, ["starter deck", "starter set", "deck set", "preconstructed"])) {
    return "STARTER_DECK";
  }
  if (matchesAny(nameLower, ["prerelease"])) return "PRERELEASE_KIT";
  if (matchesAny(nameLower, ["gift box", "gift set", "gift bundle", "gift collection"])) {
    return "GIFT_BOX";
  }
  if (matchesAny(nameLower, ["collection box", "collector box", "tin", "tins", "blister"])) {
    return "COLLECTION_BOX";
  }
  if (matchesAny(nameLower, ["bundle", "collection"])) return "BUNDLE";
  if (
    matchesAny(nameLower, ["booster pack", "booster packs"]) ||
    (matchesAny(nameLower, ["pack", "packs"]) && !matchesAny(nameLower, ["box", "boxes"]))
  ) {
    return "BOOSTER_PACK";
  }
  return "BOOSTER_BOX";
}

/** True when TCGCSV describes the row with per-card fields — it is a single, not sealed. */
export function hasSingleCardExtendedData(
  extendedData?: Array<{ name?: string; value?: string }> | null,
): boolean {
  if (!extendedData?.length) return false;
  return extendedData.some((entry) =>
    CARD_EXTENDED_DATA_KEYS.has(String(entry?.name ?? "").trim().toLowerCase()),
  );
}

export function isSealedTcgCsvProduct(
  name: string,
  extendedData?: Array<{ name?: string; value?: string }> | null,
): boolean {
  if (hasSingleCardExtendedData(extendedData)) return false;
  const full = name.toLowerCase();
  if (CARD_NUMBER.test(full)) return false;
  if (NON_PRODUCT_PREFIXES.some((p) => full.startsWith(p))) return false;

  // "display" é avaliado no nome inteiro: "Deadly Display (Red)" é carta, "Deck (Jinx) Display" não.
  if (TRAILING_DISPLAY.test(full)) return true;

  const n = stripParentheticals(full);
  if (matchesAny(n, SEALED_PHRASES)) return true;
  return TRAILING_CASE.test(n) && !PROSE_BEFORE_CASE.test(n);
}

export function resolveTcgCsvSealedCaps(mode: ProductCatalogSyncContext["mode"]): {
  maxGroupsPerGame: number;
  maxProductsPerGame: number;
  maxProductsGlobal: number;
  minYear: number;
} {
  const isFull = mode === "full";
  const minYear = Number(process.env.TCGCSV_SEALED_MIN_YEAR ?? "0");
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
    minYear: Number.isFinite(minYear) && minYear > 1990 ? minYear : 0,
  };
}

/**
 * Grupo sem `publishedOn` passa no corte: o TCGCSV deixa a data vazia em coleções recentes
 * e descartar por ausência de dado esconderia lançamento novo, que é o alvo do recorte.
 */
export function groupPassesMinYear(publishedOn: string | undefined, minYear: number): boolean {
  if (minYear <= 0) return true;
  const year = Number(String(publishedOn ?? "").slice(0, 4));
  if (!Number.isFinite(year) || year === 0) return true;
  return year >= minYear;
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
    const { maxGroupsPerGame, maxProductsPerGame, maxProductsGlobal, minYear } =
      resolveTcgCsvSealedCaps(ctx.mode);
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
        .filter((g) => g.groupId != null && groupPassesMinYear(g.publishedOn, minYear))
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
          if (!productId || !name || !isSealedTcgCsvProduct(name, p.extendedData)) continue;
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
