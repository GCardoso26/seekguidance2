import { normalizeProductTitle } from "../application/normalizeTitle.js";
import type { ProductUpsert, VariantUpsert } from "../domain/models.js";

export interface ProductIdentityCandidate {
  sku?: string | null;
  ean?: string | null;
  titlePt: string;
  imageSha256?: string | null;
}

export interface ResolvedProductIdentity {
  strategy: "sku" | "ean" | "fingerprint" | "normalized_title" | "image_hash" | "new";
  existingProductId?: string;
  existingVariantId?: string;
}

/** Prioridade: SKU → EAN → fingerprint → nome normalizado → hash de imagem. */
export class ProductDeduplicationService {
  resolveProduct(
    candidate: ProductIdentityCandidate,
    lookups: {
      bySku: Map<string, string>;
      byEan: Map<string, string>;
      byNormalizedTitle: Map<string, string>;
      byImageHash: Map<string, string>;
    },
  ): ResolvedProductIdentity {
    const sku = candidate.sku?.trim();
    if (sku) {
      const id = lookups.bySku.get(sku);
      if (id) return { strategy: "sku", existingProductId: id };
    }
    const ean = candidate.ean?.trim();
    if (ean) {
      const id = lookups.byEan.get(ean);
      if (id) return { strategy: "ean", existingProductId: id };
    }
    const norm = normalizeProductTitle(candidate.titlePt);
    if (norm) {
      const id = lookups.byNormalizedTitle.get(norm);
      if (id) return { strategy: "normalized_title", existingProductId: id };
    }
    const hash = candidate.imageSha256?.trim();
    if (hash) {
      const id = lookups.byImageHash.get(hash);
      if (id) return { strategy: "image_hash", existingProductId: id };
    }
    return { strategy: "new" };
  }

  resolveVariant(
    productId: string,
    variant: Pick<VariantUpsert, "sku" | "ean" | "variantName" | "fingerprint">,
    lookups: {
      bySku: Map<string, string>;
      byEan: Map<string, string>;
      byFingerprint: Map<string, string>;
      byProductAndName: Map<string, string>;
      productIdByVariant?: Map<string, string>;
    },
  ): ResolvedProductIdentity {
    /**
     * SKU e EAN são únicos globalmente, então valem como identidade mesmo cruzando
     * produto. Fingerprint não: reaproveitar variante de outro produto foi o caminho
     * que deixou produtos sem nenhuma variante.
     */
    const belongsToProduct = (variantId: string): boolean => {
      const owner = lookups.productIdByVariant?.get(variantId);
      return owner === undefined || owner === productId;
    };

    const sku = variant.sku?.trim();
    if (sku) {
      const id = lookups.bySku.get(sku);
      if (id) return { strategy: "sku", existingVariantId: id };
    }
    const ean = variant.ean?.trim();
    if (ean) {
      const id = lookups.byEan.get(ean);
      if (id) return { strategy: "ean", existingVariantId: id };
    }
    const fp = variant.fingerprint?.trim();
    if (fp) {
      const id = lookups.byFingerprint.get(fp);
      if (id && belongsToProduct(id)) return { strategy: "fingerprint", existingVariantId: id };
    }
    const key = `${productId}::${normalizeProductTitle(variant.variantName)}`;
    const byName = lookups.byProductAndName.get(key);
    if (byName) return { strategy: "normalized_title", existingVariantId: byName };
    return { strategy: "new", existingProductId: productId };
  }

  mergeProduct(existing: ProductUpsert, incoming: ProductUpsert): ProductUpsert {
    return {
      ...existing,
      ...incoming,
      id: existing.id,
      titlePt: incoming.titlePt || existing.titlePt,
      description: incoming.description ?? existing.description,
      sku: existing.sku ?? incoming.sku,
      ean: existing.ean ?? incoming.ean,
    };
  }
}

export const productDeduplicationService = new ProductDeduplicationService();
