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
  const url = process.env.DIGIMON_SETS_URL?.trim() || "https://digimoncard.io/api-public/getAllSets";
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
      code: "DIGIMON-S1",
      name: "Digimon Card Game Set 1",
      imageUrl: "https://cdn.judgetcg.example/publishers/digimon/s1.webp",
    },
  ];
}

export const DigimonSealedProvider = createPublisherSealedProvider({
  providerId: "digimon-sealed",
  game: "DIGIMON",
  publisher: "Bandai",
  brand: "Digimon Card Game",
  fetchSets,
});

export class DigimonExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "digimon-expansion-assets";
  readonly game = "DIGIMON";

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
