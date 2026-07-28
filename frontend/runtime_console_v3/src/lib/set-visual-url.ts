/**
 * Preferência de arte visual para cards de expansão / hero do portal.
 * Prefer packshot sealed (BOX/BUNDLE) em cover_url — nunca arte de carta.
 * Depois: logo oficial do set (public/logos/sets/…).
 * Ícones SVG de set (Scryfall) não servem como capa full-bleed.
 */
export function resolveSetVisualUrl(input: {
  coverUrl?: string | null;
  iconUrl?: string | null;
  /** Official set logo under /public/logos/sets/… */
  setLogoUrl?: string | null;
  fallback: string;
}): string {
  const cover = (input.coverUrl ?? "").trim();
  if (cover) return cover;

  const setLogo = (input.setLogoUrl ?? "").trim();
  if (setLogo) return setLogo;

  const icon = (input.iconUrl ?? "").trim();
  if (icon && !/\.svg(\?|$)/i.test(icon) && !/svgs\.scryfall\.io/i.test(icon)) {
    return icon;
  }

  return input.fallback;
}
