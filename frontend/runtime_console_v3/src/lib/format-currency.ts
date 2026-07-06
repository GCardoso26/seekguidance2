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
  imageUris?: { normal?: string; small?: string; large?: string } | null;
  image_uris?: { normal?: string; small?: string; large?: string } | null;
  image_url?: string | null;
  imageUrl?: string | null;
};

function pickImageUrl(...candidates: (string | null | undefined)[]): string | null {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizeUris(
  uris?: { normal?: string; small?: string; large?: string } | null,
): { normal?: string; small?: string; large?: string } | null {
  if (!uris) return null;
  return {
    normal: uris.normal,
    small: uris.small,
    large: uris.large,
  };
}

/** Resolve URL de imagem de carta (API, catálogo ou marketplace) com fallback local. */
export function cardImageUrl(card: CardImageSource): string {
  const uris = normalizeUris(card.imageUris) ?? normalizeUris(card.image_uris);
  const raw =
    pickImageUrl(uris?.normal, uris?.large, uris?.small, card.image_url, card.imageUrl) ??
    CARD_IMAGE_PLACEHOLDER;
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

export function shouldBypassImageOptimizer(url: string): boolean {
  return isSvgImageUrl(url) || isExternalCardImageUrl(url);
}
