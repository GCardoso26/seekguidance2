import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";

export class PokemonExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "pokemon-expansion-assets";
  readonly game = "POKEMON";

  async syncExpansionAssets(): Promise<ExpansionAssetDTO[]> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const key = process.env.POKEMONTCG_API_KEY?.trim();
    if (key) headers["X-Api-Key"] = key;
    const res = await fetch("https://api.pokemontcg.io/v2/sets?pageSize=50", { headers });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
    return (body.data ?? []).flatMap((s) => {
      const code = String(s.id ?? "");
      const name = String(s.name ?? "");
      const images = s.images as { logo?: string; symbol?: string } | undefined;
      if (!code || !name) return [];
      return mapSetImagesToExpansionAssets({
        game: "POKEMON",
        providerId: this.providerId,
        code,
        name,
        logo: images?.logo,
        icon: images?.symbol,
        packArt: images?.logo,
        banner: images?.logo,
        hero: images?.logo,
      });
    });
  }
}
