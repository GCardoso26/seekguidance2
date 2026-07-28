/**
 * Preferência de arte visual para cards de expansão / hero do portal.
 * Evita SVG de set (Scryfall) como capa full-bleed — usa cover de carta quando houver.
 */
export function resolveSetVisualUrl(input: {
  coverUrl?: string | null;
  iconUrl?: string | null;
  fallback: string;
}): string {
  const cover = (input.coverUrl ?? "").trim();
  if (cover) return cover;

  const icon = (input.iconUrl ?? "").trim();
  if (icon && !/\.svg(\?|$)/i.test(icon) && !/svgs\.scryfall\.io/i.test(icon)) {
    return icon;
  }

  return input.fallback;
}
