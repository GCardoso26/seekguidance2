/**
 * Asset Pipeline V2 — Image size presets (cards, products, hero, banners).
 * Never serve "original" to clients by default — pick the nearest preset ≤ source.
 */

export type CardImageSize = "thumb" | "small" | "medium" | "large" | "full" | "original";

export const CARD_IMAGE_SIZES: Record<
  Exclude<CardImageSize, "original">,
  { width: number; height: number; suffix: string }
> = {
  thumb: { width: 120, height: 170, suffix: "_thumb" },
  small: { width: 240, height: 340, suffix: "_sm" },
  medium: { width: 420, height: 560, suffix: "_md" },
  large: { width: 800, height: 1120, suffix: "_lg" },
  full: { width: 1200, height: 1680, suffix: "_full" },
};

export const PRODUCT_IMAGE_SIZES = {
  thumb: { width: 240, height: 240, suffix: "_p240" },
  medium: { width: 420, height: 560, suffix: "_p420" },
  square: { width: 800, height: 800, suffix: "_p800" },
  large: { width: 1200, height: 1200, suffix: "_p1200" },
} as const;

export const HERO_IMAGE_SIZES = {
  desktop: { width: 1920, height: 700, suffix: "_h1920" },
  wide: { width: 1600, height: 600, suffix: "_h1600" },
  tablet: { width: 1200, height: 500, suffix: "_h1200" },
  mobile: { width: 768, height: 900, suffix: "_h768" },
} as const;

export const BANNER_IMAGE_SIZES = {
  desktop: { width: 1920, height: 400, suffix: "_b1920" },
  wide: { width: 1600, height: 350, suffix: "_b1600" },
  tablet: { width: 1200, height: 300, suffix: "_b1200" },
} as const;

export type OutputFormat = "avif" | "webp" | "jpeg";

export const OUTPUT_FORMATS: OutputFormat[] = ["avif", "webp", "jpeg"];
