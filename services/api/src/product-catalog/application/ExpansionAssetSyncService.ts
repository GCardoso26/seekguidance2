import type { Pool } from "pg";
import { createAssetService } from "../../assets/AssetService.js";
import { createLogger } from "../../platform/logging/logger.js";
import {
  computeAssetQualityScore,
  inferQualitySignals,
} from "../application/AssetQualityScore.js";
import { inferSourceType, sourcePriority } from "../application/SourceTrust.js";
import type { ExpansionAssetDTO, ExpansionAssetProvider } from "../publishers/_shared/expansionAssets.js";

const log = createLogger("product-catalog.expansion-assets");

const ROLE_MAP: Record<string, "logo" | "banner" | "background" | "hero" | "key_art" | "icon" | "wallpaper" | "gallery"> = {
  logo: "logo",
  banner: "banner",
  background: "background",
  hero: "hero",
  key_art: "key_art",
  pack_art: "gallery",
  icon: "icon",
  wallpaper: "wallpaper",
};

/**
 * Ingest expansion assets via existing AssetService (entityType catalog_set).
 * Does not modify Asset BC contracts — uses public ingest API only.
 */
export class ExpansionAssetSyncService {
  constructor(private readonly pool: Pool) {}

  async runProviders(
    providers: ExpansionAssetProvider[],
    requestId: string,
  ): Promise<{ ingested: number; errors: string[] }> {
    const assets = createAssetService(this.pool);
    let ingested = 0;
    const errors: string[] = [];

    for (const provider of providers) {
      try {
        const items = await provider.syncExpansionAssets();
        for (const item of items) {
          try {
            await this.ingestOne(assets, item, requestId);
            ingested++;
          } catch (e) {
            errors.push(`${item.providerId}:${item.expansionCode}:${item.role}:${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } catch (e) {
        errors.push(`${provider.providerId}:${e instanceof Error ? e.message : String(e)}`);
      }
    }

    log.info({ ingested, errors: errors.length }, "expansion_assets_sync_done");
    return { ingested, errors };
  }

  private async ingestOne(
    assets: ReturnType<typeof createAssetService>,
    item: ExpansionAssetDTO,
    requestId: string,
  ): Promise<void> {
    const entityId = `${item.game}:${item.expansionCode}`;
    const sourceType = inferSourceType(item.providerId);
    const priority = sourcePriority(sourceType);
    const quality = computeAssetQualityScore(
      inferQualitySignals({
        role: ROLE_MAP[item.role] ?? "gallery",
        alt: `${item.expansionName} ${item.role}`,
        cdnUrl: item.sourceUrl,
        mediaType: item.role === "logo" ? "SET_LOGO" : item.role === "banner" ? "SET_BANNER" : "SET_KEY_ART",
      }),
    );

    await assets.ingest({
      sourceUrl: item.sourceUrl,
      requestId,
      entityType: "catalog_set",
      entityId,
      role: ROLE_MAP[item.role] ?? "gallery",
      providerId: item.providerId,
      mediaType:
        item.role === "logo"
          ? "SET_LOGO"
          : item.role === "banner"
            ? "SET_BANNER"
            : item.role === "icon"
              ? "SET_ICON"
              : item.role === "wallpaper"
                ? "SET_WALLPAPER"
                : item.role === "background"
                  ? "SET_BACKGROUND"
                  : "SET_KEY_ART",
      metadata: {
        alt: `${item.expansionName} — ${item.role}`,
        provider: item.providerId,
        source: sourceType,
        mediaType:
          item.role === "logo"
            ? "SET_LOGO"
            : item.role === "banner"
              ? "SET_BANNER"
              : "SET_KEY_ART",
        // quality + trust stored in existing metadata bag (no new table)
        ...( {
          assetQualityScore: quality.score,
          assetQualityBreakdown: quality.breakdown,
          sourceType,
          sourcePriority: priority,
          expansionCode: item.expansionCode,
          expansionName: item.expansionName,
          game: item.game,
        } as Record<string, unknown>),
      } as import("../../assets/domain/types.js").AssetMetadata,
    });
  }
}
