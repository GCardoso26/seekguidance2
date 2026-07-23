import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";

export class LorcanaExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "lorcana-expansion-assets";
  readonly game = "LORCANA";

  async syncExpansionAssets(): Promise<ExpansionAssetDTO[]> {
    const url = process.env.LORCANA_SETS_URL?.trim() || "https://api.lorcana-api.com/bulk/sets";
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const body = (await res.json()) as unknown;
      const rows = Array.isArray(body) ? body : (body as { data?: unknown[] }).data ?? [];
      return (rows as Array<Record<string, unknown>>).flatMap((s) => {
        const code = String(s.code ?? s.id ?? "");
        const name = String(s.name ?? "");
        const image = (s.icon as string) || (s.logo as string) || undefined;
        if (!code || !name) return [];
        return mapSetImagesToExpansionAssets({
          game: "LORCANA",
          providerId: this.providerId,
          code,
          name,
          logo: image,
          icon: image,
          hero: image,
          banner: image,
        });
      });
    } catch {
      return [];
    }
  }
}
