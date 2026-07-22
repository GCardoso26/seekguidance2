/** Set slug helpers for Expansion Landing Pages (Epic 6). */

export function slugifySet(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function setMatchesSlug(
  set: { code?: string; name: string },
  slug: string,
): boolean {
  const s = slug.toLowerCase().trim();
  if (!s) return false;
  if (set.code && set.code.toLowerCase() === s) return true;
  if (set.code && slugifySet(set.code) === s) return true;
  if (slugifySet(set.name) === s) return true;
  return false;
}

export function setCanonicalSlug(set: { code?: string; name: string }): string {
  const fromName = slugifySet(set.name);
  if (fromName) return fromName;
  return slugifySet(set.code ?? "set");
}
