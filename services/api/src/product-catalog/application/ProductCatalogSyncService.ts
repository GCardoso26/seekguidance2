import type { Pool } from "pg";
import { createLogger } from "../../platform/logging/logger.js";
import { createAssetService } from "../../assets/AssetService.js";
import { productDeduplicationService } from "../application/ProductDeduplicationService.js";
import { notifySyncFailure } from "../application/SyncFailureNotifier.js";
import type { ImportedProductDTO } from "../domain/models.js";
import { PostgresProductCatalogRepository } from "../persistence/PostgresProductCatalogRepository.js";
import { productCatalogProviderRegistry } from "../providers/registry.js";
import type {
  ProductCatalogJobKey,
  ProductCatalogProvider,
  ProductCatalogSyncContext,
} from "../providers/ProductCatalogProvider.js";

const log = createLogger("product-catalog.sync");

export class ProductCatalogSyncService {
  constructor(
    private readonly repo: PostgresProductCatalogRepository,
    private readonly pool: Pool,
  ) {}

  async runJob(
    jobKey: ProductCatalogJobKey,
    providers: ProductCatalogProvider[],
    ctx: ProductCatalogSyncContext,
  ): Promise<{ ok: boolean; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let upserted = 0;
    let seen = 0;

    for (const provider of providers) {
      const started = Date.now();
      const runId = await this.repo.startSyncRun(jobKey, provider.providerId, ctx.mode);
      try {
        if (provider.healthCheck) {
          const health = await provider.healthCheck();
          if (!health.ok) errors.push(`${provider.providerId}:health:${health.message}`);
        }

        const products =
          ctx.mode === "incremental" && ctx.syncSince && provider.syncProductsSince
            ? await provider.syncProductsSince(ctx.syncSince, ctx)
            : await provider.syncProducts(ctx);

        seen += products.count;
        if (!products.ok && products.errors?.length) {
          errors.push(...products.errors);
        }
        const lookups = await this.repo.loadDeduplicationLookups();
        let dup = 0;
        for (const dto of products.items ?? []) {
          const n = await this.persistOne(provider, dto, lookups, ctx, errors);
          if (n === 0 && !ctx.dryRun) dup++;
          upserted += n;
        }
        await this.repo.finishSyncRun(runId, errors.length ? "failed" : "completed", {
          itemsSeen: seen,
          itemsUpserted: upserted,
          itemsDuplicate: dup,
          durationMs: Date.now() - started,
          errors,
        });
        await this.repo.touchProviderRegistry(
          provider.providerId,
          provider.category,
          errors.length ? "failed" : "completed",
          errors[0],
        );
        productCatalogProviderRegistry.markSuccess(provider.providerId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${provider.providerId}:${msg}`);
        await this.repo.finishSyncRun(runId, "failed", {
          itemsSeen: seen,
          itemsUpserted: upserted,
          durationMs: Date.now() - started,
          errors,
        });
        await this.repo.touchProviderRegistry(provider.providerId, provider.category, "failed", msg);
        productCatalogProviderRegistry.markFailure(provider.providerId, msg);
        await notifySyncFailure({ jobKey, providerId: provider.providerId, errors: [msg], requestId: ctx.requestId });
        log.error({ err: msg, providerId: provider.providerId, jobKey }, "product_catalog_sync_failed");
      }
    }

    return { ok: errors.length === 0, upserted, errors };
  }

  private async persistOne(
    provider: ProductCatalogProvider,
    dto: ImportedProductDTO,
    lookups: Awaited<ReturnType<PostgresProductCatalogRepository["loadDeduplicationLookups"]>>,
    ctx: ProductCatalogSyncContext,
    errors: string[],
  ): Promise<number> {
    if (ctx.dryRun) return 0;
    const assets = createAssetService(this.pool);
    try {
      const { productId, variantIds } = await this.repo.persistImportedProduct(
        provider.providerId,
        dto,
        lookups,
        productDeduplicationService,
      );
      let imageCount = 0;
      for (let i = 0; i < dto.variants.length; i++) {
        const variant = dto.variants[i];
        const variantId = variantIds[i];
        if (!variantId) continue;
        const images =
          variant.images.length > 0
            ? variant.images
            : (await provider.syncImages(ctx, variant.providerRef)).items ?? [];
        for (const [idx, img] of images.entries()) {
          try {
            await assets.ingest({
              sourceUrl: img.sourceUrl,
              requestId: ctx.requestId,
              entityType: "product_variant",
              entityId: variantId,
              role: img.isPrimary || idx === 0 ? "primary" : "gallery",
              sortOrder: img.sortOrder ?? idx,
              providerId: provider.providerId,
            });
            imageCount++;
          } catch (imgErr) {
            errors.push(
              `image:${variant.providerRef}:${imgErr instanceof Error ? imgErr.message : String(imgErr)}`,
            );
          }
        }
      }
      log.info({ productId, variantIds, imageCount }, "product_catalog_persisted");
      return 1;
    } catch (e) {
      errors.push(`product:${dto.providerRef}:${e instanceof Error ? e.message : String(e)}`);
      return 0;
    }
  }
}
