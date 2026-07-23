/**
 * Official Product Contents — publisher/manufacturer sourced only. No inference / AI.
 */

import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { ContentUnit, ProductContentType } from "../domain/knowledge.js";

type Q = Pool | PoolClient;

export interface ProductContentItemInput {
  contentType: ProductContentType | string;
  label: string;
  quantity: number;
  unit?: ContentUnit | string;
  skuRef?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface UpsertOfficialContentsInput {
  productId: string;
  source?: string;
  publisher?: string | null;
  manufacturer?: string | null;
  releaseNotes?: string | null;
  decklistUrl?: string | null;
  pdfUrl?: string | null;
  msrpCents?: number | null;
  official?: boolean;
  metadata?: Record<string, unknown>;
  items: ProductContentItemInput[];
}

export interface OfficialProductContentsView {
  productId: string;
  source: string;
  publisher?: string | null;
  manufacturer?: string | null;
  releaseNotes?: string | null;
  decklistUrl?: string | null;
  pdfUrl?: string | null;
  msrpCents?: number | null;
  official: boolean;
  items: Array<{
    id: string;
    contentType: string;
    label: string;
    quantity: number;
    unit: string;
    skuRef?: string | null;
    sortOrder: number;
  }>;
}

export class OfficialProductContentsService {
  constructor(private readonly db: Q) {}

  async upsert(input: UpsertOfficialContentsInput): Promise<OfficialProductContentsView> {
    const id = getIdGenerator().generate();
    const header = await this.db.query(
      `
      INSERT INTO product_catalog.official_product_contents (
        id, product_id, source, publisher, manufacturer, release_notes,
        decklist_url, pdf_url, msrp_cents, official, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      ON CONFLICT (product_id) DO UPDATE SET
        source = EXCLUDED.source,
        publisher = COALESCE(EXCLUDED.publisher, product_catalog.official_product_contents.publisher),
        manufacturer = COALESCE(EXCLUDED.manufacturer, product_catalog.official_product_contents.manufacturer),
        release_notes = COALESCE(EXCLUDED.release_notes, product_catalog.official_product_contents.release_notes),
        decklist_url = COALESCE(EXCLUDED.decklist_url, product_catalog.official_product_contents.decklist_url),
        pdf_url = COALESCE(EXCLUDED.pdf_url, product_catalog.official_product_contents.pdf_url),
        msrp_cents = COALESCE(EXCLUDED.msrp_cents, product_catalog.official_product_contents.msrp_cents),
        official = EXCLUDED.official,
        metadata = product_catalog.official_product_contents.metadata || EXCLUDED.metadata,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        input.productId,
        input.source ?? "official",
        input.publisher ?? null,
        input.manufacturer ?? null,
        input.releaseNotes ?? null,
        input.decklistUrl ?? null,
        input.pdfUrl ?? null,
        input.msrpCents ?? null,
        input.official ?? true,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    const contentsId = String(header.rows[0].id);
    await this.db.query(`DELETE FROM product_catalog.product_content_items WHERE contents_id = $1`, [
      contentsId,
    ]);
    for (const [i, item] of input.items.entries()) {
      await this.db.query(
        `
        INSERT INTO product_catalog.product_content_items (
          id, contents_id, content_type, label, quantity, unit, sku_ref, sort_order, metadata
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
        `,
        [
          getIdGenerator().generate(),
          contentsId,
          item.contentType,
          item.label,
          item.quantity,
          item.unit ?? "pcs",
          item.skuRef ?? null,
          item.sortOrder ?? i,
          JSON.stringify(item.metadata ?? {}),
        ],
      );
    }
    const view = await this.getByProductId(input.productId);
    if (!view) throw new Error("official_contents_upsert_failed");
    return view;
  }

  async getByProductId(productId: string): Promise<OfficialProductContentsView | null> {
    const header = await this.db.query(
      `SELECT * FROM product_catalog.official_product_contents WHERE product_id = $1`,
      [productId],
    );
    if (!header.rows[0]) return null;
    const h = header.rows[0];
    const items = await this.db.query(
      `
      SELECT * FROM product_catalog.product_content_items
      WHERE contents_id = $1 ORDER BY sort_order ASC, label ASC
      `,
      [h.id],
    );
    return {
      productId: String(h.product_id),
      source: String(h.source),
      publisher: h.publisher as string | null,
      manufacturer: h.manufacturer as string | null,
      releaseNotes: h.release_notes as string | null,
      decklistUrl: h.decklist_url as string | null,
      pdfUrl: h.pdf_url as string | null,
      msrpCents: h.msrp_cents != null ? Number(h.msrp_cents) : null,
      official: Boolean(h.official),
      items: items.rows.map((r) => ({
        id: String(r.id),
        contentType: String(r.content_type),
        label: String(r.label),
        quantity: Number(r.quantity),
        unit: String(r.unit),
        skuRef: r.sku_ref as string | null,
        sortOrder: Number(r.sort_order),
      })),
    };
  }
}

export function createOfficialProductContentsService(db: Pool | PoolClient) {
  return new OfficialProductContentsService(db);
}
