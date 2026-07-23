/**
 * Normalize Lorcana set rows from heterogeneous public APIs.
 * lorcana-api.com uses Set_ID / Name / Release_Date (PascalCase).
 */
export type NormalizedLorcanaSet = {
  code: string;
  name: string;
  releaseDate?: string;
  image?: string;
};

export function normalizeLorcanaSetRow(
  set: Record<string, unknown>,
): NormalizedLorcanaSet | null {
  const code = String(
    set.code ?? set.id ?? set.setCode ?? set.Set_ID ?? set.set_id ?? "",
  ).trim();
  const name = String(set.name ?? set.setName ?? set.Name ?? "").trim();
  if (!code || !name) return null;

  const releaseRaw = set.releaseDate ?? set.Release_Date ?? set.release_date;
  const releaseDate =
    releaseRaw != null && String(releaseRaw).trim() ? String(releaseRaw).trim() : undefined;

  const imagesObj = set.images as { logo?: string; icon?: string; symbol?: string } | undefined;
  const image =
    (typeof set.icon === "string" && set.icon) ||
    (typeof set.logo === "string" && set.logo) ||
    (typeof set.image === "string" && set.image) ||
    imagesObj?.logo ||
    imagesObj?.icon ||
    imagesObj?.symbol ||
    undefined;

  return { code, name, releaseDate, image: image || undefined };
}

export function extractLorcanaSetsPayload(body: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(body)) return body as Array<Record<string, unknown>>;
  if (body && typeof body === "object") {
    const o = body as { data?: unknown; sets?: unknown };
    if (Array.isArray(o.data)) return o.data as Array<Record<string, unknown>>;
    if (Array.isArray(o.sets)) return o.sets as Array<Record<string, unknown>>;
  }
  return [];
}
