import {
  createPublisherSealedProvider,
  type PublisherSetSeed,
} from "../_shared/createPublisherSealedProvider.js";
import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";
import { createPackshotUrlForSku } from "../../providers/sealed/publisherPackshots.js";

const packshotUrlForSku = createPackshotUrlForSku("fab");

async function fetchSets(): Promise<PublisherSetSeed[]> {
  const url = process.env.FAB_SETS_URL?.trim() || "https://cdn.judgetcg.example/publishers/fab/sets.json";
  // ADR-016: never fetch the placeholder `.example` CDN — fall back to the honest seed directly.
  if (url.includes(".example")) return seedFallback();
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
  // ADR-016: no fake CDN placeholder — omit imageUrl until a verified official packshot exists.
  return [
    {
      code: "FAB-S1",
      name: "Flesh and Blood Set 1",
    },
  ];
}

export const FabSealedProvider = createPublisherSealedProvider({
  providerId: "fab-sealed",
  game: "FAB",
  publisher: "Legend Story Studios",
  brand: "Flesh and Blood",
  fetchSets,
  packshotUrlForSku,
});

export class FabExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "fab-expansion-assets";
  readonly game = "FAB";

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
