import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { fingerprintFromVariantDto } from "../application/fingerprint.js";
import { normalizeProductTitle, resolveTitlePt } from "../application/normalizeTitle.js";
import { CATEGORY_TO_PRODUCT_TYPE } from "../domain/enums.js";
import type {
  BrandUpsert,
  ImportedProductDTO,
  ManufacturerUpsert,
  ProductAttributeUpsert,
  ProductUpsert,
  VariantUpsert,
} from "../domain/models.js";

type Q = Pool | PoolClient;

export interface DeduplicationLookups {
  bySku: Map<string, string>;
  byEan: Map<string, string>;
  byNormalizedTitle: Map<string, string>;
  byImageHash: Map<string, string>;
  variantBySku: Map<string, string>;
  variantByEan: Map<string, string>;
  variantByFingerprint: Map<string, string>;
  variantByProductAndName: Map<string, string>;
}

export class PostgresProductCatalogRepository {
  constructor(private readonly pool: Q) {}

  async loadDeduplicationLookups(): Promise<DeduplicationLookups> {
    const bySku = new Map<string, string>();
    const byEan = new Map<string, string>();
    const byNormalizedTitle = new Map<string, string>();
    const byImageHash = new Map<string, string>();
    const variantBySku = new Map<string, string>();
    const variantByEan = new Map<string, string>();
    const variantByFingerprint = new Map<string, string>();
    const variantByProductAndName = new Map<string, string>();

    const products = await this.pool.query<{ id: string; sku: string | null; ean: string | null; normalized_title: string }>(
      `SELECT id, sku, ean, normalized_title FROM product_catalog.products`,
    );
    for (const row of products.rows) {
      if (row.sku) bySku.set(row.sku, row.id);
      if (row.ean) byEan.set(row.ean, row.id);
      byNormalizedTitle.set(row.normalized_title, row.id);
    }

    const variants = await this.pool.query<{
      id: string;
      product_id: string;
      sku: string | null;
      ean: string | null;
      variant_name: string;
      fingerprint: string | null;
    }>(`SELECT id, product_id, sku, ean, variant_name, fingerprint FROM product_catalog.variants`);
    for (const row of variants.rows) {
      if (row.sku) variantBySku.set(row.sku, row.id);
      if (row.ean) variantByEan.set(row.ean, row.id);
      if (row.fingerprint) variantByFingerprint.set(row.fingerprint, row.id);
      variantByProductAndName.set(
        `${row.product_id}::${normalizeProductTitle(row.variant_name)}`,
        row.id,
      );
    }

    const images = await this.pool.query<{ sha256: string; entity_id: string }>(
      `
      SELECT a.sha256, l.entity_id::text AS entity_id
      FROM media.asset_links l
      JOIN media.assets a ON a.id = l.asset_id
      WHERE l.entity_type = 'product_variant' AND a.sha256 IS NOT NULL
      `,
    );
    for (const row of images.rows) {
      if (row.sha256) byImageHash.set(row.sha256, row.entity_id);
    }

    return {
      bySku,
      byEan,
      byNormalizedTitle,
      byImageHash,
      variantBySku,
      variantByEan,
      variantByFingerprint,
      variantByProductAndName,
    };
  }

  async resolveManufacturerId(name: string): Promise<string> {
    const norm = normalizeProductTitle(name);
    const alias = await this.pool.query<{ manufacturer_id: string }>(
      `SELECT manufacturer_id FROM product_catalog.manufacturer_aliases WHERE normalized_alias = $1 LIMIT 1`,
      [norm],
    );
    if (alias.rows[0]) return alias.rows[0].manufacturer_id;
    return this.upsertManufacturer({ name });
  }

  async registerManufacturerAlias(manufacturerId: string, alias: string): Promise<void> {
    const normalized = normalizeProductTitle(alias);
    await this.pool.query(
      `
      INSERT INTO product_catalog.manufacturer_aliases (manufacturer_id, alias, normalized_alias)
      VALUES ($1,$2,$3)
      ON CONFLICT (normalized_alias) DO NOTHING
      `,
      [manufacturerId, alias.trim(), normalized],
    );
  }

  async upsertManufacturer(input: ManufacturerUpsert): Promise<string> {
    const id = input.id ?? getIdGenerator().generate();
    await this.pool.query(
      `
      INSERT INTO product_catalog.manufacturers (id, name, website)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      `,
      [id, input.name.trim(), input.website ?? null],
    );
    const found = await this.pool.query<{ id: string }>(
      `SELECT id FROM product_catalog.manufacturers WHERE lower(trim(name)) = lower(trim($1)) LIMIT 1`,
      [input.name],
    );
    return found.rows[0]?.id ?? id;
  }

  async upsertBrand(input: BrandUpsert): Promise<string> {
    const id = input.id ?? getIdGenerator().generate();
    const res = await this.pool.query<{ id: string }>(
      `
      INSERT INTO product_catalog.brands (id, manufacturer_id, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (manufacturer_id, name) DO UPDATE SET updated_at = now()
      RETURNING id
      `,
      [id, input.manufacturerId, input.name.trim()],
    );
    return res.rows[0].id;
  }

  async upsertProduct(input: ProductUpsert): Promise<string> {
    const id = input.id ?? getIdGenerator().generate();
    const titlePt = resolveTitlePt(input.titlePt, input.title ?? undefined);
    const normalized = normalizeProductTitle(titlePt);
    const productType = input.productType ?? CATEGORY_TO_PRODUCT_TYPE[input.category];
    await this.pool.query(
      `
      INSERT INTO product_catalog.products (
        id, brand_id, manufacturer_id, category, subcategory, product_type, collection_id,
        sku, ean, title, title_pt, normalized_title, description, game, release_date, discontinued
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO UPDATE SET
        brand_id = COALESCE(EXCLUDED.brand_id, product_catalog.products.brand_id),
        manufacturer_id = COALESCE(EXCLUDED.manufacturer_id, product_catalog.products.manufacturer_id),
        category = EXCLUDED.category,
        subcategory = EXCLUDED.subcategory,
        product_type = EXCLUDED.product_type,
        collection_id = COALESCE(EXCLUDED.collection_id, product_catalog.products.collection_id),
        sku = COALESCE(product_catalog.products.sku, EXCLUDED.sku),
        ean = COALESCE(product_catalog.products.ean, EXCLUDED.ean),
        title = EXCLUDED.title,
        title_pt = EXCLUDED.title_pt,
        normalized_title = EXCLUDED.normalized_title,
        description = COALESCE(EXCLUDED.description, product_catalog.products.description),
        game = COALESCE(EXCLUDED.game, product_catalog.products.game),
        release_date = COALESCE(EXCLUDED.release_date, product_catalog.products.release_date),
        discontinued = EXCLUDED.discontinued,
        updated_at = now()
      `,
      [
        id,
        input.brandId ?? null,
        input.manufacturerId ?? null,
        input.category,
        input.subcategory,
        productType,
        input.collectionId ?? null,
        input.sku ?? null,
        input.ean ?? null,
        input.title ?? titlePt,
        titlePt,
        normalized,
        input.description ?? null,
        input.game ?? null,
        input.releaseDate ?? null,
        input.discontinued ?? false,
      ],
    );
    if (input.gameCodes?.length) {
      await this.linkProductGames(id, input.gameCodes);
    }
    return id;
  }

  async linkProductGames(productId: string, gameCodes: string[]): Promise<void> {
    for (const code of gameCodes) {
      await this.pool.query(
        `
        INSERT INTO product_catalog.product_games (product_id, game_id)
        SELECT $1, g.id FROM product_catalog.games g WHERE g.code = $2
        ON CONFLICT DO NOTHING
        `,
        [productId, code.toUpperCase()],
      );
    }
  }

  async upsertCollection(name: string, game?: string | null, releaseDate?: string | null): Promise<string> {
    const found = await this.pool.query<{ id: string }>(
      `SELECT id FROM product_catalog.collections WHERE lower(name) = lower($1) AND coalesce(game,'') = coalesce($2,'') LIMIT 1`,
      [name, game ?? null],
    );
    if (found.rows[0]) return found.rows[0].id;
    const id = getIdGenerator().generate();
    await this.pool.query(
      `INSERT INTO product_catalog.collections (id, game, name, release_date) VALUES ($1,$2,$3,$4)`,
      [id, game ?? null, name, releaseDate ?? null],
    );
    return id;
  }

  async upsertVariant(input: VariantUpsert): Promise<string> {
    const id = input.id ?? getIdGenerator().generate();
    await this.pool.query(
      `
      INSERT INTO product_catalog.variants (
        id, product_id, color, size, language, edition, finish, variant_name, sku, ean, fingerprint
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET
        color = COALESCE(EXCLUDED.color, product_catalog.variants.color),
        size = COALESCE(EXCLUDED.size, product_catalog.variants.size),
        language = COALESCE(EXCLUDED.language, product_catalog.variants.language),
        edition = COALESCE(EXCLUDED.edition, product_catalog.variants.edition),
        finish = COALESCE(EXCLUDED.finish, product_catalog.variants.finish),
        variant_name = EXCLUDED.variant_name,
        sku = COALESCE(product_catalog.variants.sku, EXCLUDED.sku),
        ean = COALESCE(product_catalog.variants.ean, EXCLUDED.ean),
        fingerprint = COALESCE(product_catalog.variants.fingerprint, EXCLUDED.fingerprint),
        updated_at = now()
      `,
      [
        id,
        input.productId,
        input.color ?? null,
        input.size ?? null,
        input.language ?? "pt-BR",
        input.edition ?? null,
        input.finish ?? null,
        input.variantName,
        input.sku ?? null,
        input.ean ?? null,
        input.fingerprint ?? null,
      ],
    );
    return id;
  }

  async upsertAttributes(attrs: ProductAttributeUpsert[]): Promise<void> {
    for (const a of attrs) {
      await this.pool.query(
        `
        INSERT INTO product_catalog.product_attributes (variant_id, attr_key, attr_value)
        VALUES ($1,$2,$3)
        ON CONFLICT (variant_id, attr_key, attr_value) DO NOTHING
        `,
        [a.variantId, a.key, a.value],
      );
    }
  }

  async upsertProviderMapping(
    providerId: string,
    objectType: "PRODUCT" | "VARIANT" | "IMAGE",
    providerRef: string,
    ids: { productId?: string; variantId?: string },
  ): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO product_catalog.provider_mappings (
        provider_id, provider_object_type, provider_ref, product_id, variant_id
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (provider_id, provider_object_type, provider_ref) DO UPDATE SET
        product_id = COALESCE(EXCLUDED.product_id, product_catalog.provider_mappings.product_id),
        variant_id = COALESCE(EXCLUDED.variant_id, product_catalog.provider_mappings.variant_id)
      `,
      [providerId, objectType, providerRef, ids.productId ?? null, ids.variantId ?? null],
    );
  }

  async persistImportedProduct(
    providerId: string,
    dto: ImportedProductDTO,
    lookups: DeduplicationLookups,
    dedup: import("../application/ProductDeduplicationService.js").ProductDeduplicationService,
  ): Promise<{ productId: string; variantIds: string[] }> {
    let manufacturerId: string | null = null;
    let brandId: string | null = null;
    if (dto.manufacturerName) {
      manufacturerId = await this.resolveManufacturerId(dto.manufacturerName);
    }
    if (dto.brandName && manufacturerId) {
      brandId = await this.upsertBrand({ manufacturerId, name: dto.brandName });
    }

    let collectionId: string | null = null;
    if (dto.collectionName) {
      collectionId = await this.upsertCollection(dto.collectionName, dto.game ?? dto.gameCodes?.[0], dto.releaseDate);
    }

    const gameCodes =
      dto.gameCodes ?? (dto.game ? [dto.game] : undefined);

    const identity = dedup.resolveProduct(
      {
        sku: dto.sku,
        ean: dto.ean,
        titlePt: dto.titlePt,
        imageSha256: dto.variants[0]?.images[0]?.sourceUrl,
      },
      lookups,
    );

    const productId = await this.upsertProduct({
      id: identity.existingProductId,
      brandId,
      manufacturerId,
      category: dto.category,
      subcategory: dto.subcategory,
      productType: dto.productType,
      collectionId,
      sku: dto.sku,
      ean: dto.ean,
      titlePt: dto.titlePt,
      title: dto.titleEn,
      description: dto.description,
      game: dto.game ?? gameCodes?.[0] ?? null,
      gameCodes,
      releaseDate: dto.releaseDate,
      discontinued: dto.discontinued,
    });

    await this.upsertProviderMapping(providerId, "PRODUCT", dto.providerRef, { productId });

    const variantIds: string[] = [];
    for (const v of dto.variants) {
      const fingerprint = fingerprintFromVariantDto({
        brandName: dto.brandName,
        titlePt: dto.titlePt,
        variantName: v.variantName,
        color: v.color,
        size: v.size,
        language: v.language,
        finish: v.finish,
        attributes: v.attributes,
      });
      const vIdentity = dedup.resolveVariant(
        productId,
        { sku: v.sku, ean: v.ean, variantName: v.variantName, fingerprint },
        {
          bySku: lookups.variantBySku,
          byEan: lookups.variantByEan,
          byFingerprint: lookups.variantByFingerprint,
          byProductAndName: lookups.variantByProductAndName,
        },
      );
      const variantId = await this.upsertVariant({
        id: vIdentity.existingVariantId,
        productId,
        color: v.color,
        size: v.size,
        language: v.language,
        edition: v.edition,
        finish: v.finish,
        variantName: v.variantName,
        sku: v.sku,
        ean: v.ean,
        fingerprint,
      });
      if (v.attributes) {
        await this.upsertAttributes(
          Object.entries(v.attributes).map(([key, value]) => ({
            variantId,
            key,
            value,
          })),
        );
      }
      variantIds.push(variantId);
      await this.upsertProviderMapping(providerId, "VARIANT", v.providerRef, {
        productId,
        variantId,
      });
    }

    return { productId, variantIds };
  }

  async startSyncRun(jobKey: string, providerId: string, mode: "full" | "incremental"): Promise<string> {
    const id = getIdGenerator().generate();
    await this.pool.query(
      `
      INSERT INTO product_catalog.sync_runs (id, job_key, provider_id, status, mode)
      VALUES ($1,$2,$3,'running',$4)
      `,
      [id, jobKey, providerId, mode],
    );
    return id;
  }

  async finishSyncRun(
    runId: string,
    status: "completed" | "failed",
    stats: {
      itemsSeen: number;
      itemsUpserted: number;
      itemsNew?: number;
      itemsUpdated?: number;
      itemsDuplicate?: number;
      durationMs?: number;
      errors: string[];
    },
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE product_catalog.sync_runs
      SET status = $2, finished_at = now(), items_seen = $3, items_upserted = $4,
          items_new = $5, items_updated = $6, items_duplicate = $7,
          duration_ms = $8, errors = $9::jsonb
      WHERE id = $1
      `,
      [
        runId,
        status,
        stats.itemsSeen,
        stats.itemsUpserted,
        stats.itemsNew ?? 0,
        stats.itemsUpdated ?? 0,
        stats.itemsDuplicate ?? 0,
        stats.durationMs ?? null,
        JSON.stringify(stats.errors),
      ],
    );
  }

  async touchProviderRegistry(providerId: string, category: string, status: string, error?: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO product_catalog.provider_registry (provider_id, category, last_sync_at, last_status, last_error)
      VALUES ($1,$2,now(),$3,$4)
      ON CONFLICT (provider_id) DO UPDATE SET
        last_sync_at = now(),
        last_status = EXCLUDED.last_status,
        last_error = EXCLUDED.last_error,
        updated_at = now()
      `,
      [providerId, category, status, error ?? null],
    );
  }
}
