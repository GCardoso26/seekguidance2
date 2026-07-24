import { describe, expect, it, vi } from "vitest";
import { ProductCategory } from "../../domain/enums.js";
import { PostgresProductCatalogRepository } from "../PostgresProductCatalogRepository.js";

describe("PostgresProductCatalogRepository.upsertProduct", () => {
  it("reuses existing product id when SKU already exists (no blind INSERT)", async () => {
    const existingId = "11111111-1111-1111-1111-111111111111";
    const queries: Array<{ sql: string; params: unknown[] }> = [];
    const pool = {
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        queries.push({ sql, params });
        if (sql.includes("SELECT id FROM product_catalog.products WHERE sku")) {
          return { rows: [{ id: existingId }] };
        }
        if (sql.includes("INSERT INTO product_catalog.products")) {
          expect(params[0]).toBe(existingId);
          return { rows: [] };
        }
        return { rows: [] };
      }),
    };

    const repo = new PostgresProductCatalogRepository(pool as never);
    const id = await repo.upsertProduct({
      category: ProductCategory.SEALED_PRODUCT,
      subcategory: "BOOSTER_PACK",
      sku: "MTG-PACK-VOC",
      titlePt: "Booster Pack — Crimson Vow Commander",
      title: "Booster Pack — Crimson Vow Commander",
      game: "MTG",
    });

    expect(id).toBe(existingId);
    expect(queries.some((q) => q.sql.includes("WHERE sku"))).toBe(true);
    expect(queries.some((q) => q.sql.includes("INSERT INTO product_catalog.products"))).toBe(true);
  });

  it("generates a new id when SKU is unknown", async () => {
    const pool = {
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes("SELECT id FROM product_catalog.products WHERE sku")) {
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO product_catalog.products")) {
          expect(typeof params[0]).toBe("string");
          expect(params[0]).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          );
          return { rows: [] };
        }
        return { rows: [] };
      }),
    };

    const repo = new PostgresProductCatalogRepository(pool as never);
    const id = await repo.upsertProduct({
      category: ProductCategory.SEALED_PRODUCT,
      subcategory: "BOOSTER_PACK",
      sku: "MTG-PACK-NEWSET",
      titlePt: "Booster Pack — New Set",
    });

    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(pool.query).toHaveBeenCalled();
  });

  it("skips SKU lookup when id is already provided", async () => {
    const providedId = "22222222-2222-2222-2222-222222222222";
    const pool = {
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes("SELECT id FROM product_catalog.products WHERE sku")) {
          throw new Error("SKU lookup should be skipped when id is provided");
        }
        if (sql.includes("INSERT INTO product_catalog.products")) {
          expect(params[0]).toBe(providedId);
          return { rows: [] };
        }
        return { rows: [] };
      }),
    };

    const repo = new PostgresProductCatalogRepository(pool as never);
    const id = await repo.upsertProduct({
      id: providedId,
      category: ProductCategory.SEALED_PRODUCT,
      subcategory: "BOOSTER_BOX",
      sku: "MTG-BOX-VOC",
      titlePt: "Booster Box — Crimson Vow",
    });

    expect(id).toBe(providedId);
  });

  it("retries with existing id when INSERT hits uq_product_catalog_sku race", async () => {
    const racedId = "33333333-3333-3333-3333-333333333333";
    let selectCount = 0;
    let insertAttempts = 0;
    const pool = {
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes("SELECT id FROM product_catalog.products WHERE sku")) {
          selectCount += 1;
          // First lookup (before insert): empty. Second (after race): found.
          if (selectCount === 1) return { rows: [] };
          return { rows: [{ id: racedId }] };
        }
        if (sql.includes("INSERT INTO product_catalog.products")) {
          insertAttempts += 1;
          if (insertAttempts === 1) {
            throw Object.assign(
              new Error('duplicate key value violates unique constraint "uq_product_catalog_sku"'),
              { code: "23505", constraint: "uq_product_catalog_sku" },
            );
          }
          expect(params[0]).toBe(racedId);
          return { rows: [] };
        }
        return { rows: [] };
      }),
    };

    const repo = new PostgresProductCatalogRepository(pool as never);
    const id = await repo.upsertProduct({
      category: ProductCategory.SEALED_PRODUCT,
      subcategory: "BOOSTER_PACK",
      sku: "YUGIOH-PACK-CT10",
      titlePt: "Booster Pack — Collectible Tin",
    });

    expect(id).toBe(racedId);
    expect(insertAttempts).toBe(2);
  });
});
