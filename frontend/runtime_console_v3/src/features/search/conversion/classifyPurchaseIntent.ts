import type { PurchaseIntent } from "./types";

const ACCESSORY_PATTERNS = [
  /\bdragon\s*shield\b/i,
  /\bperfect\s*fit\b/i,
  /\bplaymat\b/i,
  /\btapete\b/i,
  /\bdeck\s*box\b/i,
  /\bcaixa\s*de\s*deck\b/i,
  /\bsleeve(s)?\b/i,
  /\bcapa(s)?\b/i,
  /\bbinder\b/i,
  /\bpasta\b/i,
  /\btop\s*loader\b/i,
  /\bdice\b/i,
  /\bdados?\b/i,
  /\bstorage\b/i,
  /\bultra\s*pro\b/i,
  /\bkmc\b/i,
];

const SEALED_PATTERNS = [
  /\bbooster(s)?\b/i,
  /\bdisplay\b/i,
  /\betb\b/i,
  /\belite\s*trainer\b/i,
  /\bstarter\s*deck\b/i,
  /\bbundle\b/i,
  /\bbox\s*set\b/i,
  /\bprerelease\b/i,
  /\bselado(s)?\b/i,
  /\bsealed\b/i,
];

/**
 * Classifica intenção de compra a partir da query.
 * Não inventa estoque — só orienta ranking e superfícies secundárias.
 */
export function classifyPurchaseIntent(query: string): PurchaseIntent {
  const q = query.trim();
  if (!q) return "generic";

  if (ACCESSORY_PATTERNS.some((re) => re.test(q))) return "accessory";
  if (SEALED_PATTERNS.some((re) => re.test(q))) return "sealed";

  // Nomes de carta conhecidos / tokens de single → single
  // (heurística leve: qualquer query restante sem keyword de produto = single)
  return "single";
}

/** Preferências de superfície secundária por intent. */
export function secondarySurfacesForIntent(
  intent: PurchaseIntent,
): Array<"marketplace_products" | "singles" | "collections" | "wishlist"> {
  switch (intent) {
    case "accessory":
      return ["marketplace_products", "wishlist", "collections"];
    case "sealed":
      return ["marketplace_products", "singles", "wishlist"];
    case "single":
      return ["singles", "marketplace_products", "collections", "wishlist"];
    default:
      return ["singles", "marketplace_products", "collections"];
  }
}
