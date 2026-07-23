/** Official product relationship types — Product Catalog only, no AI. */
export const PRODUCT_RELATION_TYPES = [
  "contains",
  "contained_in",
  "compatible_with",
  "recommended_with",
  "replacement_for",
  "variant_of",
  "bundle_of",
  "requires",
  "accessory_for",
  "expansion_of",
  "collection_of",
  "promo_for",
  "includes",
  "included_by",
] as const;

export type ProductRelationType = (typeof PRODUCT_RELATION_TYPES)[number];

export interface ProductRelationship {
  id: string;
  fromProductId: string;
  toProductId: string;
  relationType: ProductRelationType;
  source: string;
  confidence: number;
  official: boolean;
  publisher?: string | null;
  manufacturer?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProductRelationshipInput {
  fromProductId: string;
  toProductId: string;
  relationType: ProductRelationType;
  source?: string;
  confidence?: number;
  official?: boolean;
  publisher?: string | null;
  manufacturer?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RelatedProductView {
  productId: string;
  titlePt: string;
  category: string;
  subcategory: string;
  relationType: ProductRelationType;
  confidence: number;
  imageUrl?: string | null;
}
