import {
  createPublisherSealedProvider,
  type PublisherSetSeed,
} from "../_shared/createPublisherSealedProvider.js";
import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";

async function fetchSets(): Promise<PublisherSetSeed[]> {
  const url = process.env.SWU_SETS_URL?.trim();
  // ADR-016: no `.example` CDN fallback. Without an explicit URL, use honest seed.
  if (!url || url.includes(".example")) return seedFallback();
  try {
    const res = await fetch(url);
    if (!res.ok) return seedFallback();
    const body = (await res.json()) as unknown;
    const rows = Array.isArray(body) ? body : (body as { data?: unknown[] }).data ?? [];
    return (rows as Array<Record<string, unknown>>)
      .map((s) => ({
        code: String(s.code ?? s.id ?? s.set_code ?? s.set_name ?? "").slice(0, 32),
        name: String(s.name ?? s.set_name ?? s.set_code ?? ""),
        releaseDate: s.tcg_date ? String(s.tcg_date) : s.release_date ? String(s.release_date) : undefined,
        imageUrl: (s.image as string) || (s.logo as string) || undefined,
        logoUrl: (s.logo as string) || undefined,
      }))
      .filter((s) => s.code && s.name)
      .slice(0, 80);
  } catch {
    return seedFallback();
  }
}

function seedFallback(): PublisherSetSeed[] {
  // ADR-016: no fake CDN placeholder — omit imageUrl.
  return [
    {
      code: "SWU-S1",
      name: "Star Wars Unlimited Set 1",
    },
  ];
}

/**
 * ADR-016: SWU (Star Wars: Unlimited) is hard-exit denylisted from the product
 * ecosystem (insufficient BR demand). Not registered in providers/registry.ts —
 * kept here only so reopening SWU later doesn't require rewriting the provider.
 * Reopening requires an explicit new ADR.
 */
export const StarWarsSealedProvider = createPublisherSealedProvider({
  providerId: "star-wars-sealed",
  game: "SWU",
  publisher: "Fantasy Flight Games",
  brand: "Star Wars Unlimited",
  fetchSets,
});

export class StarWarsExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "star-wars-expansion-assets";
  readonly game = "SWU";

  async syncExpansionAssets(): Promise<ExpansionAssetDTO[]> {
    const sets = await fetchSets();
    return sets.flatMap((s) =>
      mapSetImagesToExpansionAssets({
        game: this.game,
        providerId: this.providerId,
        code: s.code,
        name: s.name,
        logo: s.logoUrl ?? s.imageUrl,
        icon: s.logoUrl ?? s.imageUrl,
        packArt: s.imageUrl,
        banner: s.imageUrl,
        hero: s.imageUrl,
      }),
    );
  }
}
