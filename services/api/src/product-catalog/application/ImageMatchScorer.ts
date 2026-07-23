/**
 * Matching inteligente para auto-link de imagens oficiais.
 * Nunca faz match exclusivo por nome — nome é fator parcial.
 */

export const IMAGE_MATCH_AUTO_LINK_THRESHOLD = 0.85;

export type ImageMatchDomain = "accessory" | "sealed";

export interface AccessoryMatchCandidate {
  domain: "accessory";
  manufacturer?: string | null;
  brand?: string | null;
  sku?: string | null;
  ean?: string | null;
  upc?: string | null;
  aliases?: string[];
  productName?: string | null;
  accessoryType?: string | null;
}

export interface SealedMatchCandidate {
  domain: "sealed";
  game?: string | null;
  expansion?: string | null;
  productType?: string | null;
  publisher?: string | null;
  upc?: string | null;
  ean?: string | null;
  aliases?: string[];
  release?: string | null;
  sku?: string | null;
  productName?: string | null;
}

export type ImageMatchCandidate = AccessoryMatchCandidate | SealedMatchCandidate;

export interface ImageMatchTarget {
  manufacturer?: string | null;
  brand?: string | null;
  sku?: string | null;
  ean?: string | null;
  upc?: string | null;
  aliases?: string[];
  productName?: string | null;
  accessoryType?: string | null;
  game?: string | null;
  expansion?: string | null;
  productType?: string | null;
  publisher?: string | null;
  release?: string | null;
}

export interface ImageMatchResult {
  score: number;
  factors: Record<string, number>;
  shouldAutoLink: boolean;
  exclusiveNameOnly: boolean;
}

function norm(v?: string | null): string {
  return (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function eq(a?: string | null, b?: string | null): boolean {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y && x === y);
}

function aliasHit(aliases: string[] | undefined, name?: string | null): boolean {
  const n = norm(name);
  if (!n || !aliases?.length) return false;
  return aliases.some((a) => norm(a) === n || (norm(a).length > 3 && n.includes(norm(a))));
}

function softName(a?: string | null, b?: string | null): number {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.55;
  const xt = new Set(x.split(" ").filter((t) => t.length > 2));
  const yt = y.split(" ").filter((t) => t.length > 2);
  if (!xt.size || !yt.length) return 0;
  const hit = yt.filter((t) => xt.has(t)).length;
  return hit / Math.max(xt.size, yt.length);
}

/** Score 0..1. Auto-link apenas com identidade forte (SKU/EAN/UPC/aliases+tipo) além de nome. */
export function scoreImageMatch(
  candidate: ImageMatchCandidate,
  target: ImageMatchTarget,
): ImageMatchResult {
  const factors: Record<string, number> = {};

  if (candidate.domain === "accessory") {
    if (eq(candidate.sku, target.sku)) factors.sku = 0.4;
    if (eq(candidate.ean, target.ean) || eq(candidate.upc, target.upc) || eq(candidate.ean, target.upc)) {
      factors.eanUpc = 0.32;
    }
    if (eq(candidate.manufacturer, target.manufacturer)) factors.manufacturer = 0.14;
    if (eq(candidate.brand, target.brand)) factors.brand = 0.14;
    if (eq(candidate.accessoryType, target.accessoryType)) factors.accessoryType = 0.12;
    if (aliasHit(candidate.aliases, target.productName) || aliasHit(target.aliases, candidate.productName)) {
      factors.aliases = 0.15;
    }
    const nameScore = softName(candidate.productName, target.productName);
    if (nameScore > 0) factors.productName = nameScore * 0.2;
  } else {
    if (eq(candidate.sku, target.sku)) factors.sku = 0.3;
    if (eq(candidate.ean, target.ean) || eq(candidate.upc, target.upc) || eq(candidate.ean, target.upc)) {
      factors.eanUpc = 0.28;
    }
    if (eq(candidate.game, target.game)) factors.game = 0.15;
    if (eq(candidate.expansion, target.expansion)) factors.expansion = 0.15;
    if (eq(candidate.productType, target.productType)) factors.productType = 0.1;
    if (eq(candidate.publisher, target.publisher)) factors.publisher = 0.08;
    if (eq(candidate.release, target.release)) factors.release = 0.05;
    if (aliasHit(candidate.aliases, target.productName) || aliasHit(target.aliases, candidate.productName)) {
      factors.aliases = 0.12;
    }
    const nameScore = softName(candidate.productName, target.productName);
    if (nameScore > 0) factors.productName = nameScore * 0.18;
  }

  const score = Math.min(1, Object.values(factors).reduce((a, b) => a + b, 0));
  const identityKeys = ["sku", "eanUpc", "aliases", "manufacturer", "brand", "game", "expansion"];
  const hasIdentity = identityKeys.some((k) => (factors[k] ?? 0) > 0);
  const exclusiveNameOnly = Boolean(factors.productName) && !hasIdentity;
  const shouldAutoLink =
    score >= IMAGE_MATCH_AUTO_LINK_THRESHOLD && hasIdentity && !exclusiveNameOnly;

  return { score, factors, shouldAutoLink, exclusiveNameOnly };
}
