/**
 * Taxonomy navigation helpers — Publisher → Game → Category → SubCategory → Family → Product.
 */

import type { TaxonomyPath } from "../domain/knowledge.js";

export function taxonomyBreadcrumb(path: TaxonomyPath): string[] {
  return [
    path.publisher,
    path.game,
    path.category,
    path.subcategory,
    path.productFamily,
    path.productId,
    path.variantId,
  ].filter((x): x is string => Boolean(x && String(x).trim()));
}

export function parseTaxonomyQuery(q: Record<string, string | undefined>): TaxonomyPath {
  return {
    publisher: q.publisher,
    game: q.game,
    category: q.category,
    subcategory: q.subcategory,
    productFamily: q.productFamily ?? q.product_family,
    productId: q.productId ?? q.product_id,
    variantId: q.variantId ?? q.variant_id,
  };
}
