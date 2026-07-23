import {
  emptyAssetPackage,
  type PublisherAssetPackage,
  type UniversalPublisherProvider,
} from "../_shared/PublisherAssetPackage.js";
import { mapSetImagesToExpansionAssets } from "../_shared/expansionAssets.js";

/**
 * Example Universal Publisher provider — Magic via Scryfall API.
 * Other publishers implement the same interface.
 */
export class MagicUniversalPublisherProvider implements UniversalPublisherProvider {
  readonly providerId = "magic-universal-package";
  readonly publisher = "Wizards of the Coast";

  async syncAssetPackages(opts?: { since?: string; dryRun?: boolean }): Promise<PublisherAssetPackage[]> {
    void opts;
    const res = await fetch("https://api.scryfall.com/sets");
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const packages: PublisherAssetPackage[] = [];
    for (const set of (body.data ?? []).slice(0, 40)) {
      const code = String(set.code ?? "");
      const name = String(set.name ?? "");
      if (!code || !name) continue;
      const icon = set.icon_svg_uri ? String(set.icon_svg_uri) : undefined;
      const expansionAssets = mapSetImagesToExpansionAssets({
        game: "MTG",
        providerId: this.providerId,
        code,
        name,
        icon,
        logo: icon,
        symbol: icon,
      });
      packages.push(
        emptyAssetPackage(this.publisher, {
          game: "MTG",
          expansion: name,
          releaseDate: set.released_at ? String(set.released_at) : undefined,
          assets: {
            sealed: icon
              ? [{ role: "box", sourceUrl: icon, mediaType: "SEALED_PRODUCT", sourceTrust: 100, sourceType: "publisher_api" }]
              : [],
            expansion: expansionAssets.map((a) => ({
              role: a.role,
              sourceUrl: a.sourceUrl,
              sourceTrust: 100,
              sourceType: "publisher_api",
            })),
          },
          relationships: [
            { relationType: "contains", targetRef: `booster-pack:${code}`, confidence: 1 },
            { relationType: "recommended_with", targetRef: `sleeves:standard`, confidence: 0.9 },
          ],
          metadata: { setCode: code, providerId: this.providerId },
        }),
      );
    }
    return packages;
  }
}
