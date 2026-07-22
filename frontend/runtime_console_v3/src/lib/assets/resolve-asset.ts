/**
 * Asset URL resolution — prefer HD; never upscale small sources for large slots.
 */
import {
  CARD_IMAGE_SIZES,
  type CardSizeKey,
  type MediaType,
} from "@/lib/assets/media-catalog";

export type ImageUriMap = {
  thumb?: string;
  small?: string;
  normal?: string;
  medium?: string;
  large?: string;
  full?: string;
  artCrop?: string;
  png?: string;
};

const SIZE_ORDER: CardSizeKey[] = ["thumb", "small", "medium", "large", "full"];

const ALIAS: Record<string, CardSizeKey> = {
  thumb: "thumb",
  small: "small",
  normal: "medium",
  medium: "medium",
  large: "large",
  full: "full",
};

export type ResolvedAsset = {
  src: string;
  size: CardSizeKey | "source";
  /** True when we refused to upscale and fell back to a smaller derivative */
  clamped: boolean;
  width?: number;
  height?: number;
};

function normalizeUris(uris?: ImageUriMap | null): ImageUriMap | null {
  if (!uris) return null;
  return uris;
}

/**
 * Pick best URL for a target display size.
 * Rule: never use a known-smaller source and stretch it to a larger slot —
 * clamp to the largest available ≤ target.
 */
export function resolveCardAsset(
  uris: ImageUriMap | null | undefined,
  target: CardSizeKey = "medium",
  fallbacks: Array<string | null | undefined> = [],
): ResolvedAsset | null {
  const map = normalizeUris(uris);
  const available: Partial<Record<CardSizeKey, string>> = {};

  if (map) {
    for (const [key, url] of Object.entries(map)) {
      if (!url) continue;
      const size = ALIAS[key];
      if (size) available[size] = url;
    }
  }

  const targetIdx = SIZE_ORDER.indexOf(target);
  // Prefer exact or larger-or-equal available without inventing upscale of tiny thumbs for full hero slots
  for (let i = targetIdx; i >= 0; i--) {
    const size = SIZE_ORDER[i];
    const url = available[size];
    if (url) {
      const dims = CARD_IMAGE_SIZES[size];
      return {
        src: url,
        size,
        clamped: i < targetIdx,
        width: dims.width,
        height: dims.height,
      };
    }
  }
  // If only larger exists (rare), use next larger — still not inventing pixels from nothing
  for (let i = targetIdx + 1; i < SIZE_ORDER.length; i++) {
    const size = SIZE_ORDER[i];
    const url = available[size];
    if (url) {
      const dims = CARD_IMAGE_SIZES[size];
      return { src: url, size, clamped: false, width: dims.width, height: dims.height };
    }
  }

  for (const fb of fallbacks) {
    if (fb) return { src: fb, size: "source", clamped: false };
  }
  return null;
}

/** HD preference for PDP / collection zoom — large then full then medium. */
export function resolveHdCardAsset(
  uris: ImageUriMap | null | undefined,
  fallbacks: Array<string | null | undefined> = [],
): ResolvedAsset | null {
  return (
    resolveCardAsset(uris, "full", fallbacks) ??
    resolveCardAsset(uris, "large", fallbacks) ??
    resolveCardAsset(uris, "medium", fallbacks)
  );
}

export function buildDerivativeUrl(
  baseCdnUrl: string,
  size: CardSizeKey | "original" = "original",
): string {
  if (size === "original") return baseCdnUrl;
  const suffix =
    size === "thumb"
      ? "_thumb"
      : size === "small"
        ? "_sm"
        : size === "medium"
          ? "_md"
          : size === "large"
            ? "_lg"
            : "_full";
  const match = baseCdnUrl.match(/^(.*)(\.[a-zA-Z0-9]+)(\?.*)?$/);
  if (!match) return `${baseCdnUrl}${suffix}`;
  const [, path, ext, query = ""] = match;
  return `${path}${suffix}${ext}${query}`;
}

export function lqipFromColor(hex = "#e5e7eb", w = 16, h = 22): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${hex}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function lqipForMedia(mediaType: MediaType, label = ""): string {
  const text = (label || mediaType).slice(0, 24);
  const aspect =
    mediaType.startsWith("HERO") || mediaType.includes("BANNER")
      ? { w: 48, h: 18 }
      : mediaType.includes("ACCESSORY") || mediaType.includes("SEALED")
        ? { w: 24, h: 32 }
        : { w: 20, h: 28 };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${aspect.w}" height="${aspect.h}"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="4" font-family="system-ui">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export type AssetMetaView = {
  alt?: string;
  caption?: string;
  copyright?: string;
  provider?: string;
  source?: string;
  license?: string;
  hash?: string;
  width?: number;
  height?: number;
  mime?: string;
  checksum?: string;
  dominantColor?: string;
  lqip?: string;
};

export type GalleryItem = {
  id: string;
  url: string;
  shot?: string;
  label?: string;
  meta?: AssetMetaView;
};
