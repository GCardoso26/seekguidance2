/** Official product relationship types — Product Catalog only, no AI. */
export const PRODUCT_RELATION_TYPES = [
  "contains",
  "contained_in",
  "compatible_with",
  "recommended_with",
  "recommended_for",
  "supports",
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

export type RelationshipEntityType = "product" | "game" | "product_family" | "collection";

export interface ProductRelationship {
  id: string;
  fromProductId: string;
  toProductId: string | null;
  toGameCode?: string | null;
  toEntityType: RelationshipEntityType;
  toEntityRef?: string | null;
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
  toProductId?: string | null;
  toGameCode?: string | null;
  toEntityType?: RelationshipEntityType;
  toEntityRef?: string | null;
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

export interface EntityRelationshipView {
  relationType: ProductRelationType;
  toEntityType: RelationshipEntityType;
  toEntityRef?: string | null;
  toGameCode?: string | null;
  confidence: number;
}

export function buildRelationshipTargetKey(input: {
  toProductId?: string | null;
  toEntityType?: RelationshipEntityType | null;
  toEntityRef?: string | null;
  toGameCode?: string | null;
}): string {
  if (input.toProductId) return `p:${input.toProductId}`;
  return `e:${input.toEntityType ?? "product"}:${input.toEntityRef ?? ""}:${input.toGameCode ?? ""}`;
}
