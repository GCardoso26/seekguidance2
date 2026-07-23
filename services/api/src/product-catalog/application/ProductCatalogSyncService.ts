import type { Pool } from "pg";
import { createLogger } from "../../platform/logging/logger.js";
import { createAssetService } from "../../assets/AssetService.js";
import { appendDomainEvent } from "../../platform/events/DomainEventStore.js";
import { ProductCategory } from "../domain/enums.js";
import { productDeduplicationService } from "../application/ProductDeduplicationService.js";
import { explainImageMatch } from "../application/ExplainableMatching.js";
import {
  computeAssetQualityScore,
  inferQualitySignals,
} from "../application/AssetQualityScore.js";
import {
  inferSourceType,
  shouldReplaceOfficialAsset,
  sourcePriority,
} from "../application/SourceTrust.js";
import { mediaTypeForCategory } from "../application/mediaTypeForCategory.js";
import { notifySyncFailure } from "../application/SyncFailureNotifier.js";
import { createAssetVersioningService } from "../application/AssetVersioningService.js";
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
      await appendDomainEvent(this.pool, {
        eventType: "ProductImported",
        aggregateType: "product",
        aggregateId: productId,
        payload: {
          providerId: provider.providerId,
          providerRef: dto.providerRef,
          category: dto.category,
          sku: dto.sku ?? null,
          action: "search.reindex",
        },
        metadata: { requestId: ctx.requestId, correlationId: ctx.requestId },
      });
      const isSealed = dto.category === ProductCategory.SEALED_PRODUCT;
      let imageCount = 0;
      let lowConfidenceSkip = 0;
      let replacedByHigherTrust = 0;
      const incomingSourceType = inferSourceType(provider.providerId);
      const incomingPriority = sourcePriority(incomingSourceType);
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
            const role = img.isPrimary || idx === 0 ? "primary" : "gallery";
            const candidate = isSealed
              ? {
                  domain: "sealed" as const,
                  game: dto.gameCodes?.[0] ?? dto.game,
                  expansion: dto.collectionName,
                  productType: dto.subcategory,
                  publisher: dto.manufacturerName,
                  sku: variant.sku ?? dto.sku,
                  ean: variant.ean ?? dto.ean,
                  upc: variant.ean ?? dto.ean,
                  release: dto.releaseDate,
                  productName: dto.titlePt,
                  aliases: [dto.titleEn, dto.titlePt].filter(Boolean) as string[],
                }
              : {
                  domain: "accessory" as const,
                  manufacturer: dto.manufacturerName,
                  brand: dto.brandName,
                  sku: variant.sku ?? dto.sku,
                  ean: variant.ean ?? dto.ean,
                  upc: variant.ean ?? dto.ean,
                  accessoryType: dto.subcategory,
                  productName: dto.titlePt,
                  aliases: [dto.titleEn, dto.titlePt].filter(Boolean) as string[],
                };
            const target = {
              manufacturer: dto.manufacturerName,
              brand: dto.brandName,
              sku: variant.sku ?? dto.sku,
              ean: variant.ean ?? dto.ean,
              upc: variant.ean ?? dto.ean,
              accessoryType: dto.subcategory,
              game: dto.gameCodes?.[0] ?? dto.game,
              expansion: dto.collectionName,
              productType: dto.subcategory,
              publisher: dto.manufacturerName,
              release: dto.releaseDate,
              productName: dto.titlePt,
              aliases: [dto.titleEn, dto.titlePt].filter(Boolean) as string[],
            };
            const explained = explainImageMatch(candidate, target);
            const allowFromProvider = Boolean(dto.sku || dto.ean || variant.sku || variant.ean);
            if (explained.decision !== "auto_link" && !allowFromProvider) {
              lowConfidenceSkip++;
              log.info(
                {
                  confidencePct: explained.confidencePct,
                  decision: explained.decision,
                  explanation: explained.explanation,
                  missingSignals: explained.missingSignals,
                  providerRef: variant.providerRef,
                },
                "product_catalog_image_explainable_skip",
              );
              continue;
            }

            const existing = await assets.listForEntity("product_variant", variantId);
            const primary = existing.find((a) => a.role === "primary" || a.role === "front");
            const existingPriority = Number(
              (primary?.metadata as { sourcePriority?: number } | null | undefined)?.sourcePriority ?? 0,
            );
            if (
              primary &&
              role === "primary" &&
              !shouldReplaceOfficialAsset({
                existingPriority,
                incomingPriority,
                existingEntityType: "product_variant",
              }) &&
              existingPriority > 0 &&
              incomingPriority <= existingPriority
            ) {
              log.info(
                { existingPriority, incomingPriority, variantId },
                "product_catalog_skip_lower_trust_source",
              );
              continue;
            }
            if (primary && incomingPriority > existingPriority && existingPriority > 0) {
              replacedByHigherTrust++;
            }

            const mediaType = mediaTypeForCategory(
              dto.category,
              role === "gallery" ? "gallery" : "primary",
            );
            const quality = computeAssetQualityScore(
              inferQualitySignals({
                role,
                alt: dto.titlePt,
                cdnUrl: img.sourceUrl,
                mediaType,
              }),
            );

            const ingestResult = await assets.ingest({
              sourceUrl: img.sourceUrl,
              requestId: ctx.requestId,
              entityType: "product_variant",
              entityId: variantId,
              role,
              sortOrder: img.sortOrder ?? idx,
              providerId: provider.providerId,
              mediaType,
              metadata: {
                alt: dto.titlePt,
                provider: provider.providerId,
                source: incomingSourceType,
                mediaType,
                ...( {
                  assetQualityScore: quality.score,
                  assetQualityBreakdown: quality.breakdown,
                  sourceType: incomingSourceType,
                  sourcePriority: incomingPriority,
                  matchConfidencePct: explained.confidencePct,
                  matchDecision: explained.decision,
                  matchExplanation: explained.explanation,
                } as Record<string, unknown>),
              } as import("../../assets/domain/types.js").AssetMetadata,
            });
            try {
              const versions = createAssetVersioningService(this.pool);
              await versions.append({
                assetId: ingestResult.asset.id,
                entityType: "product_variant",
                entityId: variantId,
                source: incomingSourceType,
                sourceTrust: incomingPriority,
                qualityScore: quality.score,
                sha256: ingestResult.asset.sha256,
                width: ingestResult.asset.width,
                height: ingestResult.asset.height,
                format: ingestResult.asset.mime,
                sizeBytes: ingestResult.asset.sizeBytes,
                cdnUrl: ingestResult.asset.cdnUrl,
                pipelineVersion: "v2",
                derivatives: ingestResult.asset.derivatives ?? {},
                metadata: {
                  reused: ingestResult.reused,
                  providerId: provider.providerId,
                },
                createdBy: provider.providerId,
              });
            } catch (verErr) {
              log.warn(
                { err: verErr instanceof Error ? verErr.message : String(verErr) },
                "asset_version_append_skipped",
              );
            }
            imageCount++;
          } catch (imgErr) {
            errors.push(
              `image:${variant.providerRef}:${imgErr instanceof Error ? imgErr.message : String(imgErr)}`,
            );
          }
        }
      }
      log.info(
        { productId, variantIds, imageCount, lowConfidenceSkip, replacedByHigherTrust },
        "product_catalog_persisted",
      );
      return 1;
    } catch (e) {
      errors.push(`product:${dto.providerRef}:${e instanceof Error ? e.message : String(e)}`);
      return 0;
    }
  }
}
