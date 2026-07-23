import {
  createPublisherSealedProvider,
  type PublisherSetSeed,
} from "../_shared/createPublisherSealedProvider.js";
import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";

async function fetchOnePieceSets(): Promise<PublisherSetSeed[]> {
  const url = process.env.ONE_PIECE_SETS_URL?.trim() || "https://optcgapi.com/api/sets";
  try {
    const res = await fetch(url);
    if (!res.ok) return seedFallback("ONE_PIECE");
    const body = (await res.json()) as unknown;
    const rows = Array.isArray(body) ? body : (body as { data?: unknown[] }).data ?? [];
    return (rows as Array<Record<string, unknown>>).map((s) => ({
      code: String(s.code ?? s.id ?? s.set_id ?? ""),
      name: String(s.name ?? s.set_name ?? ""),
      releaseDate: s.release_date ? String(s.release_date) : undefined,
      imageUrl: (s.image as string) || (s.logo as string) || undefined,
      logoUrl: (s.logo as string) || undefined,
    })).filter((s) => s.code && s.name);
  } catch {
    return seedFallback("ONE_PIECE");
  }
}

function seedFallback(game: string): PublisherSetSeed[] {
  return [
    {
      code: `${game}-S1`,
      name: `${game} Starter Set`,
      imageUrl: `https://cdn.judgetcg.example/publishers/${game.toLowerCase()}/s1-logo.webp`,
    },
  ];
}

export const OnePieceSealedProvider = createPublisherSealedProvider({
  providerId: "one-piece-sealed",
  game: "ONE_PIECE",
  publisher: "Bandai",
  brand: "One Piece Card Game",
  fetchSets: fetchOnePieceSets,
});

export class OnePieceExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "one-piece-expansion-assets";
  readonly game = "ONE_PIECE";

  async syncExpansionAssets(): Promise<ExpansionAssetDTO[]> {
    const sets = await fetchOnePieceSets();
    return sets.flatMap((s) =>
      mapSetImagesToExpansionAssets({
        game: this.game,
        providerId: this.providerId,
        code: s.code,
        name: s.name,
        logo: s.logoUrl ?? s.imageUrl,
        icon: s.logoUrl,
        packArt: s.imageUrl,
      }),
    );
  }
}
