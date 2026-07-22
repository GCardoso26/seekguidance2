/**
 * CDN inteligente V2 — URLs derivadas (resoluções + formatos).
 * thumb | small | medium | large | full | original
 * Nunca servir original ao cliente por padrão — use pickSafeDerivativeSize.
 */
import {
  CARD_IMAGE_SIZES,
  type CardImageSize,
  type OutputFormat,
  OUTPUT_FORMATS,
} from "../domain/imageSizes.js";

export type CdnDerivativeSize = CardImageSize;

const SIZE_SUFFIX: Record<Exclude<CdnDerivativeSize, "original">, string> = {
  thumb: CARD_IMAGE_SIZES.thumb.suffix,
  small: CARD_IMAGE_SIZES.small.suffix,
  medium: CARD_IMAGE_SIZES.medium.suffix,
  large: CARD_IMAGE_SIZES.large.suffix,
  full: CARD_IMAGE_SIZES.full.suffix,
};

export function buildDerivativeUrl(
  baseCdnUrl: string,
  size: CdnDerivativeSize = "original",
): string {
  if (size === "original") return baseCdnUrl;
  const suffix = SIZE_SUFFIX[size];
  const match = baseCdnUrl.match(/^(.*)(\.[a-zA-Z0-9]+)(\?.*)?$/);
  if (!match) return `${baseCdnUrl}${suffix}`;
  const [, path, ext, query = ""] = match;
  return `${path}${suffix}${ext}${query}`;
}

/** Swap extension for modern formats (AVIF / WebP / JPEG fallback). */
export function buildFormatUrl(url: string, format: OutputFormat): string {
  const match = url.match(/^(.*)(\.[a-zA-Z0-9]+)(\?.*)?$/);
  if (!match) return `${url}.${format}`;
  const [, path, , query = ""] = match;
  const ext = format === "jpeg" ? ".jpg" : `.${format}`;
  return `${path}${ext}${query}`;
}

export function buildDerivativeSet(baseCdnUrl: string): Record<CdnDerivativeSize, string> {
  return {
    thumb: buildDerivativeUrl(baseCdnUrl, "thumb"),
    small: buildDerivativeUrl(baseCdnUrl, "small"),
    medium: buildDerivativeUrl(baseCdnUrl, "medium"),
    large: buildDerivativeUrl(baseCdnUrl, "large"),
    full: buildDerivativeUrl(baseCdnUrl, "full"),
    original: baseCdnUrl,
  };
}

/** Full pipeline derivative map: size × format. */
export function buildFormatDerivativeMap(
  baseCdnUrl: string,
): Record<string, { url: string; mime: string; width?: number; height?: number }> {
  const sizes = buildDerivativeSet(baseCdnUrl);
  const out: Record<string, { url: string; mime: string; width?: number; height?: number }> = {};

  for (const [size, url] of Object.entries(sizes) as [CdnDerivativeSize, string][]) {
    const dims =
      size === "original"
        ? undefined
        : CARD_IMAGE_SIZES[size as Exclude<CdnDerivativeSize, "original">];
    for (const format of OUTPUT_FORMATS) {
      const key = `${size}.${format}`;
      out[key] = {
        url: size === "original" && format === "jpeg" ? url : buildFormatUrl(url, format),
        mime: format === "jpeg" ? "image/jpeg" : `image/${format}`,
        width: dims?.width,
        height: dims?.height,
      };
    }
    out[size] = {
      url,
      mime: "image/webp",
      width: dims?.width,
      height: dims?.height,
    };
  }
  return out;
}

/**
 * Never upscale: if source width known and smaller than target, clamp to largest safe size.
 */
export function pickSafeDerivativeSize(
  requested: Exclude<CdnDerivativeSize, "original">,
  sourceWidth?: number | null,
): Exclude<CdnDerivativeSize, "original"> {
  if (!sourceWidth || sourceWidth <= 0) return requested;
  const order: Array<Exclude<CdnDerivativeSize, "original">> = [
    "thumb",
    "small",
    "medium",
    "large",
    "full",
  ];
  const reqIdx = order.indexOf(requested);
  let best = order[0];
  for (const size of order) {
    if (CARD_IMAGE_SIZES[size].width <= sourceWidth) best = size;
    if (order.indexOf(size) >= reqIdx && CARD_IMAGE_SIZES[size].width <= sourceWidth) {
      return size;
    }
  }
  return best;
}
