import { normalizeProductTitle } from "./normalizeTitle.js";

export interface FingerprintParts {
  brandSlug?: string;
  productSlug?: string;
  texture?: string;
  color?: string;
  capacity?: string;
  size?: string;
  language?: string;
  finish?: string;
  attributes?: Record<string, string>;
}

/** Tokeniza para fingerprint estável (dedup cross-provider). */
export function slugToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function buildVariantFingerprint(parts: FingerprintParts): string {
  const tokens: string[] = [];
  if (parts.brandSlug) tokens.push(slugToken(parts.brandSlug));
  if (parts.productSlug) tokens.push(slugToken(parts.productSlug));
  if (parts.texture) tokens.push(slugToken(parts.texture));
  if (parts.color) tokens.push(slugToken(parts.color));
  if (parts.capacity) tokens.push(slugToken(parts.capacity));
  if (parts.size) tokens.push(slugToken(parts.size));
  if (parts.language) tokens.push(slugToken(parts.language));
  if (parts.finish) tokens.push(slugToken(parts.finish));
  if (parts.attributes) {
    for (const [k, v] of Object.entries(parts.attributes).sort(([a], [b]) => a.localeCompare(b))) {
      tokens.push(`${slugToken(k)}:${slugToken(v)}`);
    }
  }
  return tokens.filter(Boolean).join("|");
}

export function fingerprintFromVariantDto(input: {
  brandName?: string;
  titlePt: string;
  variantName: string;
  color?: string;
  size?: string;
  language?: string;
  finish?: string;
  attributes?: Record<string, string>;
}): string {
  return buildVariantFingerprint({
    brandSlug: input.brandName,
    productSlug: normalizeProductTitle(input.titlePt),
    color: input.color,
    size: input.size,
    language: input.language,
    finish: input.finish,
    attributes: input.attributes,
  });
}
