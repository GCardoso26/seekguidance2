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
}

export interface ManufacturerManifest {
  version: number;
  manufacturerId: string;
  manufacturer: string;
  brand: string;
  website?: string;
  items: ManufacturerManifestItem[];
}
