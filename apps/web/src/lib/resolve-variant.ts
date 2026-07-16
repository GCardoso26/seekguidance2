import type { PublicApiClient } from "@/src/api/public.client";

/**
 * Resolve catalogVariantId from human foil choice via Public API.
 * Never asks the user for technical IDs.
 */
export async function resolveVariantId(
  publicApi: PublicApiClient,
  catalogCardId: string,
  foil: boolean,
): Promise<{ catalogVariantId: string; finish: string }> {
  const finish = foil ? "foil" : "nonfoil";
  try {
    const { items } = await publicApi.listVariants(catalogCardId, finish);
    const match = items.find((v) => v.finish.toLowerCase() === finish) ?? items[0];
    if (match) {
      return { catalogVariantId: match.id, finish: match.finish };
    }
  } catch {
    // Fall through to deterministic convention used by Public DTO mapper
  }
  return { catalogVariantId: `${catalogCardId}:${finish}`, finish };
}
