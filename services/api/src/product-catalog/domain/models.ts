import type { ProductCategory, ProductCondition, ProductType } from "./enums.js";

export interface ManufacturerUpsert {
  id?: string;
  name: string;
  website?: string | null;
}

export interface BrandUpsert {
  id?: string;
  manufacturerId: string;
  name: string;
}

export interface ProductUpsert {
  id?: string;
  brandId?: string | null;
  manufacturerId?: string | null;
  category: ProductCategory;
  subcategory: string;
  productType?: ProductType;
  collectionId?: string | null;
  sku?: string | null;
  ean?: string | null;
  titlePt: string;
  title?: string | null;
  description?: string | null;
  game?: string | null;
  gameCodes?: string[];
  releaseDate?: string | null;
  discontinued?: boolean;
}

export interface VariantUpsert {
  id?: string;
  productId: string;
  color?: string | null;
  size?: string | null;
  language?: string | null;
  edition?: string | null;
  finish?: string | null;
  variantName: string;
  sku?: string | null;
  ean?: string | null;
  fingerprint?: string | null;
}

export interface ProductAttributeUpsert {
  variantId: string;
  key: string;
  value: string;
}

export interface ImageUpsert {
  id?: string;
  variantId: string;
  url: string;
  sha256?: string | null;
  sortOrder?: number;
  width?: number | null;
  height?: number | null;
  source?: string | null;
  isPrimary?: boolean;
}

export interface SellerProductUpsert {
  id?: string;
  storeId: string;
  variantId: string;
  stock: number;
  priceCents: number;
  condition: ProductCondition;
  isActive?: boolean;
}

/** DTOs de importação (provider → domínio). */
export interface ImportedProductDTO {
  providerRef: string;
  manufacturerName?: string;
  brandName?: string;
  category: ProductCategory;
  subcategory: string;
  productType?: import("./enums.js").ProductType;
  sku?: string;
  ean?: string;
  titlePt: string;
  titleEn?: string;
  description?: string;
  /** @deprecated prefer gameCodes */
  game?: string;
  gameCodes?: string[];
  collectionName?: string;
  releaseDate?: string;
  discontinued?: boolean;
  variants: ImportedVariantDTO[];
  /** Official Knowledge Graph fields — only when provider supplies them. */
  officialContents?: Array<{
    contentType: string;
    label: string;
    quantity: number;
    unit?: string;
  }>;
  specifications?: {
    specSchema: string;
    widthMm?: number;
    heightMm?: number;
    depthMm?: number;
    thicknessMm?: number;
    weightGrams?: number;
    capacity?: number;
    pieces?: number;
    microns?: number;
    material?: string;
    finish?: string;
    color?: string;
    pvcFree?: boolean;
    acidFree?: boolean;
    waterResistant?: boolean;
    cardsCount?: number;
    foilsCount?: number;
    language?: string;
    region?: string;
    msrpCents?: number;
    extra?: Record<string, unknown>;
  };
  officialMetadata?: {
    publisher?: string;
    manufacturer?: string;
    game?: string;
    expansion?: string;
    collection?: string;
    series?: string;
    releaseDate?: string;
    language?: string;
    country?: string;
    msrpCents?: number;
    sku?: string;
    upc?: string;
    ean?: string;
    productFamily?: string;
    productLine?: string;
    edition?: string;
    lifecycle?: string;
  };
}

export interface ImportedVariantDTO {
  providerRef: string;
  variantName: string;
  sku?: string;
  ean?: string;
  color?: string;
  size?: string;
  language?: string;
  edition?: string;
  finish?: string;
  /** Atributos fabricante-específicos (Capacity, Material, Texture…). */
  attributes?: Record<string, string>;
  images: ImportedImageDTO[];
}

export interface ImportedImageDTO {
  sourceUrl: string;
  isPrimary?: boolean;
  sortOrder?: number;
}
