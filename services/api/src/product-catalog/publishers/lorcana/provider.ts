import {
  mapSetImagesToExpansionAssets,
  type ExpansionAssetDTO,
  type ExpansionAssetProvider,
} from "../_shared/expansionAssets.js";
import {
  extractLorcanaSetsPayload,
  normalizeLorcanaSetRow,
} from "../../providers/sealed/lorcanaSetNormalize.js";

export class LorcanaExpansionAssetsProvider implements ExpansionAssetProvider {
  readonly providerId = "lorcana-expansion-assets";
  readonly game = "LORCANA";

  async syncExpansionAssets(): Promise<ExpansionAssetDTO[]> {
    const url = process.env.LORCANA_SETS_URL?.trim() || "https://api.lorcana-api.com/bulk/sets";
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "JudgeTCG/product-catalog (https://judgetcg.com.br)",
        },
      });
      if (!res.ok) return [];
      const body = (await res.json()) as unknown;
      const rows = extractLorcanaSetsPayload(body);
      return rows.flatMap((s) => {
        const norm = normalizeLorcanaSetRow(s);
        if (!norm) return [];
        return mapSetImagesToExpansionAssets({
          game: "LORCANA",
          providerId: this.providerId,
          code: norm.code,
          name: norm.name,
          logo: norm.image,
          icon: norm.image,
          hero: norm.image,
          banner: norm.image,
        });
      });
    } catch {
      return [];
    }
  }
}
