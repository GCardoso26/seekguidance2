import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import { createPostgresCatalogStack } from "../createPostgresCatalogStack.js";

const databaseUrl =
  process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

describe.skipIf(!databaseUrl)("createPostgresCatalogStack wiring", () => {
  it("exposes TX, repos, outbox and application services", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      const stack = createPostgresCatalogStack(pool);
      expect(stack.tx).toBeTruthy();
      expect(stack.cards).toBeTruthy();
      expect(stack.sets).toBeTruthy();
      expect(stack.variants).toBeTruthy();
      expect(stack.mappings).toBeTruthy();
      expect(stack.outbox).toBeTruthy();
      expect(stack.apps.persistCard).toBeTruthy();
      expect(stack.apps.persistSet).toBeTruthy();
      expect(stack.apps.persistVariant).toBeTruthy();

      const gameId = crypto.randomUUID();
      const code = `W${gameId.replace(/-/g, "").slice(0, 7)}`;
      await pool.query(
        `INSERT INTO catalog.catalog_games (id, code, name, slug) VALUES ($1,$2,$3,$4)`,
        [gameId, code, "Wiring Game", `wiring-${gameId.slice(0, 8)}`],
      );

    const set = await stack.apps.persistSet.execute({
      requestId: "wire-1",
      provider: "scryfall",
      set: { gameId, code: "WIR", name: "Wiring Set" },
      providerSetId: "wir",
    });
    expect(set.entity.code).toBe("WIR");

    const pending = await stack.outbox.countByStatus("pending");
    expect(pending).toBeGreaterThanOrEqual(1);

    await pool.query(
      `DELETE FROM catalog.provider_mappings WHERE catalog_set_id = $1`,
      [set.entity.id],
    );
    await pool.query(`DELETE FROM platform.outbox_events WHERE aggregate_id = $1`, [
      set.entity.id,
    ]);
    await pool.query(`DELETE FROM catalog.catalog_sets WHERE id = $1`, [set.entity.id]);
    await pool.query(`DELETE FROM catalog.catalog_games WHERE id = $1`, [gameId]);
    } finally {
      await pool.end();
    }
  });
});
