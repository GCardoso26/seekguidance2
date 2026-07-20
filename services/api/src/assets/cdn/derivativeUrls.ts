/**
 * CDN inteligente — URLs derivadas a partir da chave R2/CDN.
 * thumb | small | medium | large | original
 */
export type CdnDerivativeSize = "thumb" | "small" | "medium" | "large" | "original";

const SIZE_SUFFIX: Record<CdnDerivativeSize, string> = {
  thumb: "_thumb",
  small: "_sm",
  medium: "_md",
  large: "_lg",
  original: "",
};

export function buildDerivativeUrl(
  baseCdnUrl: string,
  size: CdnDerivativeSize = "original",
): string {
  if (size === "original") return baseCdnUrl;
  const suffix = SIZE_SUFFIX[size];
  // https://cdn/.../abc.webp → https://cdn/.../abc_md.webp
  const match = baseCdnUrl.match(/^(.*)(\.[a-zA-Z0-9]+)(\?.*)?$/);
  if (!match) return `${baseCdnUrl}${suffix}`;
  const [, path, ext, query = ""] = match;
  return `${path}${suffix}${ext}${query}`;
}

export function buildDerivativeSet(baseCdnUrl: string): Record<CdnDerivativeSize, string> {
  return {
    thumb: buildDerivativeUrl(baseCdnUrl, "thumb"),
    small: buildDerivativeUrl(baseCdnUrl, "small"),
    medium: buildDerivativeUrl(baseCdnUrl, "medium"),
    large: buildDerivativeUrl(baseCdnUrl, "large"),
    original: baseCdnUrl,
  };
}
