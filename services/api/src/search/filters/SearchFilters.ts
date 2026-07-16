import type { SearchCardDocument, SearchFilters } from "../domain/SearchDocument.js";

export function matchesFilters(doc: SearchCardDocument, f: SearchFilters): boolean {
  if (f.setCode && (doc.setCode ?? "").toUpperCase() !== f.setCode.toUpperCase()) return false;
  if (f.language && doc.language.toLowerCase() !== f.language.toLowerCase()) return false;
  if (f.finish && !doc.finishes.map((x) => x.toLowerCase()).includes(f.finish.toLowerCase())) {
    return false;
  }
  if (f.storeId && !doc.storeIds.includes(f.storeId)) return false;
  if (f.hasStock === true && !doc.hasStock) return false;
  if (f.hasStock === false && doc.hasStock) return false;
  if (f.rarity && (doc.rarity ?? "").toLowerCase() !== f.rarity.toLowerCase()) return false;
  if (f.priceMin != null && (doc.priceMax == null || doc.priceMax < f.priceMin)) return false;
  if (f.priceMax != null && (doc.priceMin == null || doc.priceMin > f.priceMax)) return false;

  const nameQ = (f.name ?? f.q ?? "").trim().toLowerCase();
  if (nameQ) {
    const hay = `${doc.name} ${doc.nameNormalized}`.toLowerCase();
    if (!hay.includes(nameQ)) return false;
  }

  const oracleQ = (f.oracle ?? "").trim().toLowerCase();
  if (oracleQ) {
    if (!(doc.oracleText ?? "").toLowerCase().includes(oracleQ)) return false;
  }

  return true;
}

/** Meilisearch filter expression (AND). */
export function toMeiliFilter(f: SearchFilters): string | undefined {
  const parts: string[] = [];
  if (f.setCode) parts.push(`setCode = "${escapeFilter(f.setCode.toUpperCase())}"`);
  if (f.language) parts.push(`language = "${escapeFilter(f.language.toLowerCase())}"`);
  if (f.finish) parts.push(`finishes = "${escapeFilter(f.finish)}"`);
  if (f.storeId) parts.push(`storeIds = "${escapeFilter(f.storeId)}"`);
  if (f.hasStock === true) parts.push(`hasStock = true`);
  if (f.hasStock === false) parts.push(`hasStock = false`);
  if (f.rarity) parts.push(`rarity = "${escapeFilter(f.rarity.toLowerCase())}"`);
  if (f.priceMin != null) parts.push(`priceMax >= ${Number(f.priceMin)}`);
  if (f.priceMax != null) parts.push(`priceMin <= ${Number(f.priceMax)}`);
  return parts.length ? parts.join(" AND ") : undefined;
}

function escapeFilter(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
