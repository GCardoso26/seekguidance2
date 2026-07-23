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
  const url = process.env.RIFTBOUND_SETS_URL?.trim() || "https://cdn.judgetcg.example/publishers/riftbound/sets.json";
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
  return [
    {
      code: "RIFTBOUND-S1",
      name: "Riftbound Set 1",
      imageUrl: "https://cdn.judgetcg.example/publishers/riftbound/s1.webp",
    },
  ];
}

export const RiftboundSealedProvider = createPublisherSealedProvider({
  providerId: "riftbound-sealed",
  game: "RIFTBOUND",
  publisher: "Riot Games",
  brand: "Riftbound",
  fetchSets,
});

export class RiftboundExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "riftbound-expansion-assets";
  readonly game = "RIFTBOUND";

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
