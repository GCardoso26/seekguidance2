export function formatCurrency(value: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

const CARD_IMAGE_PLACEHOLDER = "/logos/default-tcg.svg";
const SORCERY_CDN = "https://d27a44hjr9gen3.cloudfront.net";
const SORCERY_SLUG_RE = /^([a-z]+)-(.+)-([a-z]+)-([sf])$/;

function sorcerySlugToCdnUrl(slug: string): string | null {
  const match = SORCERY_SLUG_RE.exec(slug.trim());
  if (!match) return null;
  const [, setPrefix, name, product, finish] = match;
  return `${SORCERY_CDN}/${setPrefix}/${name}_${product}_${finish}.png`;
}

function normalizeSorceryImageUrl(url: string): string {
  if (!url.includes("cards.sorcerytcg.com")) return url;
  const filename = url.split("/").pop() ?? "";
  const slug = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return sorcerySlugToCdnUrl(slug) ?? url;
}

type CardImageSource = {
  imageUris?: {
    normal?: string;
    small?: string;
    large?: string;
    full?: string;
    thumb?: string;
  } | null;
  image_uris?: {
    normal?: string;
    small?: string;
    large?: string;
    full?: string;
    thumb?: string;
  } | null;
  image_url?: string | null;
  imageUrl?: string | null;
};

function normalizeUris(
  uris?: {
    normal?: string;
    small?: string;
    large?: string;
    full?: string;
    thumb?: string;
  } | null,
): {
  normal?: string;
  small?: string;
  large?: string;
  full?: string;
  thumb?: string;
} | null {
  if (!uris) return null;
  return {
    normal: uris.normal,
    small: uris.small,
    large: uris.large,
    full: uris.full,
    thumb: uris.thumb,
  };
}

import { resolveCardAsset, resolveHdCardAsset } from "@/lib/assets/resolve-asset";

/**
 * Resolve URL de imagem de carta (Asset Pipeline V2).
 * Prefere HD via resolveHdCardAsset; fallback legado image_url.
 */
export function cardImageUrl(card: CardImageSource): string {
  const uris = normalizeUris(card.imageUris) ?? normalizeUris(card.image_uris);
  const resolved = resolveHdCardAsset(
    {
      thumb: uris?.thumb,
      small: uris?.small,
      medium: uris?.normal,
      large: uris?.large,
      full: uris?.full,
    },
    [card.image_url, card.imageUrl],
  );
  const raw = resolved?.src ?? CARD_IMAGE_PLACEHOLDER;
  return normalizeSorceryImageUrl(raw);
}

/** Lista / grid — medium preferido; evita full desnecessário. */
export function cardImageUrlForList(card: CardImageSource): string {
  const uris = normalizeUris(card.imageUris) ?? normalizeUris(card.image_uris);
  const resolved = resolveCardAsset(
    {
      thumb: uris?.thumb,
      small: uris?.small,
      medium: uris?.normal,
      large: uris?.large,
      full: uris?.full,
    },
    "medium",
    [card.image_url, card.imageUrl, uris?.small, uris?.thumb],
  );
  const raw = resolved?.src ?? CARD_IMAGE_PLACEHOLDER;
  return normalizeSorceryImageUrl(raw);
}

export function isSvgImageUrl(url: string): boolean {
  return url.endsWith(".svg") || url.startsWith("data:image/svg");
}

/** URLs absolutas de CDNs de TCG — bypass do otimizador Next (/_next/image). */
export function isExternalCardImageUrl(url: string): boolean {
  const trimmed = url?.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("data:")) return false;
  return /^https?:\/\//i.test(trimmed);
}

/** Schemes that next/image cannot fetch (fixture sync placeholders, etc.). */
export function isUnusableImageSrc(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return true;
  if (/^(fixture|blob|file|chrome-extension):/i.test(trimmed)) return true;
  return false;
}

export function shouldBypassImageOptimizer(url: string): boolean {
  return isSvgImageUrl(url) || isExternalCardImageUrl(url);
}
