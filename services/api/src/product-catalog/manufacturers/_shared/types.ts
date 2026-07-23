import type { UniversalAccessoryType } from "./accessoryTaxonomy.js";

export interface ManufacturerManifestImage {
  role: "packshot" | "hero" | "banner" | "logo" | "marketing" | "lifestyle" | "gallery";
  sourceUrl: string;
  isPrimary?: boolean;
}

export interface ManufacturerManifestItem {
  sku: string;
  titlePt: string;
  titleEn?: string;
  accessoryType: UniversalAccessoryType;
  subcategory?: string;
  ean?: string;
  upc?: string;
  aliases?: string[];
  images: ManufacturerManifestImage[];
  /** Official-only Knowledge Graph payload (manifest / PDF / API). */
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

export interface ManufacturerManifest {
  version: number;
  manufacturerId: string;
  manufacturer: string;
  brand: string;
  website?: string;
  items: ManufacturerManifestItem[];
}
