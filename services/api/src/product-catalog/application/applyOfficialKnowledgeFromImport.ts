/**
 * Applies official knowledge (contents / specs / metadata) from import DTOs.
 * Only when providers supply official fields — never inferred.
 */

import type { Pool, PoolClient } from "pg";
import type { ImportedProductDTO } from "../domain/models.js";
import { createOfficialProductContentsService } from "./OfficialProductContentsService.js";
import { createOfficialSpecificationsService } from "./OfficialSpecificationsService.js";
import { createUniversalMetadataService } from "./UniversalMetadataService.js";
import type { ProductLifecycle } from "../domain/knowledge.js";

export async function applyOfficialKnowledgeFromImport(
  db: Pool | PoolClient,
  productId: string,
  dto: ImportedProductDTO,
): Promise<void> {
  if (dto.officialContents?.length) {
    await createOfficialProductContentsService(db).upsert({
      productId,
      publisher: dto.officialMetadata?.publisher ?? null,
      manufacturer: dto.manufacturerName ?? dto.officialMetadata?.manufacturer ?? null,
      msrpCents: dto.officialMetadata?.msrpCents ?? null,
      items: dto.officialContents.map((c, i) => ({
        contentType: c.contentType,
        label: c.label,
        quantity: c.quantity,
        unit: c.unit ?? "pcs",
        sortOrder: i,
      })),
    });
  }

  if (dto.specifications) {
    const s = dto.specifications;
    await createOfficialSpecificationsService(db).upsert({
      productId,
      specSchema: s.specSchema,
      widthMm: s.widthMm,
      heightMm: s.heightMm,
      depthMm: s.depthMm,
      thicknessMm: s.thicknessMm,
      weightGrams: s.weightGrams,
      capacity: s.capacity,
      pieces: s.pieces,
      microns: s.microns,
      material: s.material,
      finish: s.finish,
      color: s.color,
      pvcFree: s.pvcFree,
      acidFree: s.acidFree,
      waterResistant: s.waterResistant,
      cardsCount: s.cardsCount,
      foilsCount: s.foilsCount,
      language: s.language,
      region: s.region,
      msrpCents: s.msrpCents,
      extra: s.extra,
    });
  }

  const meta = dto.officialMetadata;
  if (meta || dto.manufacturerName || dto.sku) {
    await createUniversalMetadataService(db).upsert(productId, {
      publisher: meta?.publisher ?? null,
      manufacturer: meta?.manufacturer ?? dto.manufacturerName ?? null,
      game: meta?.game ?? dto.game ?? dto.gameCodes?.[0] ?? null,
      expansion: meta?.expansion ?? dto.collectionName ?? null,
      collection: meta?.collection ?? dto.collectionName ?? null,
      series: meta?.series ?? null,
      releaseDate: meta?.releaseDate ?? dto.releaseDate ?? null,
      language: meta?.language ?? null,
      country: meta?.country ?? null,
      msrpCents: meta?.msrpCents ?? null,
      sku: meta?.sku ?? dto.sku ?? null,
      upc: meta?.upc ?? null,
      ean: meta?.ean ?? dto.ean ?? null,
      productFamily: meta?.productFamily ?? null,
      productLine: meta?.productLine ?? null,
      edition: meta?.edition ?? null,
      lifecycle: (meta?.lifecycle as ProductLifecycle | undefined) ?? "AVAILABLE",
    });
  }
}
