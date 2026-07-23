import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";

export class MagicExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "magic-expansion-assets";
  readonly game = "MTG";

  async syncExpansionAssets(): Promise<ExpansionAssetDTO[]> {
    const res = await fetch("https://api.scryfall.com/sets");
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
    return (body.data ?? []).slice(0, 100).flatMap((s) => {
      const code = String(s.code ?? "");
      const name = String(s.name ?? "");
      if (!code || !name) return [];
      const icon = s.icon_svg_uri ? String(s.icon_svg_uri) : undefined;
      return mapSetImagesToExpansionAssets({
        game: "MTG",
        providerId: this.providerId,
        code,
        name,
        icon,
        logo: icon,
        symbol: icon,
      });
    });
  }
}
