/**
 * Product Knowledge Coverage analytics — admin endpoints only, no Analytics BC.
 */

import type { Pool, PoolClient } from "pg";

type Q = Pool | PoolClient;

export interface KnowledgeCoverageReport {
  overallPct: number;
  productKnowledgeCoverage: number;
  officialContentCoverage: number;
  specificationCoverage: number;
  metadataCoverage: number;
  lifecycleCoverage: number;
  collectionCoverage: number;
  assetPackageCoverage: number;
  knowledgeCompletenessScore: number;
  totals: {
    products: number;
    withContents: number;
    withSpecs: number;
    withMetadata: number;
    withLifecycleNonDefault: number;
    withCollection: number;
    withAssetPackage: number;
  };
  generatedAt: string;
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export class KnowledgeCoverageService {
  constructor(private readonly db: Q) {}

  async computeReport(): Promise<KnowledgeCoverageReport> {
    const totals = await this.db.query<{
      products: string;
      with_contents: string;
      with_specs: string;
      with_metadata: string;
      with_lifecycle: string;
      with_collection: string;
      with_asset_pkg: string;
      avg_completeness: string;
    }>(
      `
      SELECT
        (SELECT count(*) FROM product_catalog.products) AS products,
        (SELECT count(*) FROM product_catalog.official_product_contents) AS with_contents,
        (SELECT count(DISTINCT product_id) FROM product_catalog.product_specifications) AS with_specs,
        (SELECT count(*) FROM product_catalog.product_official_metadata) AS with_metadata,
        (SELECT count(*) FROM product_catalog.products WHERE lifecycle IS NOT NULL AND lifecycle <> 'AVAILABLE') AS with_lifecycle,
        (SELECT count(*) FROM product_catalog.products WHERE collection_id IS NOT NULL) AS with_collection,
        (SELECT count(DISTINCT product_id) FROM product_catalog.product_asset_packages) AS with_asset_pkg,
        (SELECT coalesce(avg(knowledge_completeness), 0) FROM product_catalog.products) AS avg_completeness
      `,
    );
    const t = totals.rows[0];
    const products = Number(t.products);
    const withContents = Number(t.with_contents);
    const withSpecs = Number(t.with_specs);
    const withMetadata = Number(t.with_metadata);
    const withLifecycle = Number(t.with_lifecycle);
    const withCollection = Number(t.with_collection);
    const withAssetPkg = Number(t.with_asset_pkg);
    const avgCompleteness = Number(t.avg_completeness);

    const officialContentCoverage = pct(withContents, products);
    const specificationCoverage = pct(withSpecs, products);
    const metadataCoverage = pct(withMetadata, products);
    // lifecycle column is always set; coverage = share with explicit publisher metadata lifecycle
    const lifecycleCoverage = pct(withLifecycle + withMetadata, products * 2);
    const collectionCoverage = pct(withCollection, products);
    const assetPackageCoverage = pct(withAssetPkg, products);
    const knowledgeCompletenessScore = Math.round(avgCompleteness * 10) / 10;

    const slices = [
      officialContentCoverage,
      specificationCoverage,
      metadataCoverage,
      lifecycleCoverage,
      collectionCoverage,
      assetPackageCoverage,
      knowledgeCompletenessScore,
    ];
    const overallPct =
      Math.round((slices.reduce((a, b) => a + b, 0) / slices.length) * 10) / 10;

    const report: KnowledgeCoverageReport = {
      overallPct,
      productKnowledgeCoverage: overallPct,
      officialContentCoverage,
      specificationCoverage,
      metadataCoverage,
      lifecycleCoverage,
      collectionCoverage,
      assetPackageCoverage,
      knowledgeCompletenessScore,
      totals: {
        products,
        withContents,
        withSpecs,
        withMetadata,
        withLifecycleNonDefault: withLifecycle,
        withCollection,
        withAssetPackage: withAssetPkg,
      },
      generatedAt: new Date().toISOString(),
    };

    await this.db.query(
      `
      INSERT INTO product_catalog.knowledge_coverage_snapshots (overall_pct, report)
      VALUES ($1, $2::jsonb)
      `,
      [report.overallPct, JSON.stringify(report)],
    );

    return report;
  }
}

export function createKnowledgeCoverageService(db: Pool | PoolClient) {
  return new KnowledgeCoverageService(db);
}
