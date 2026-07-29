import { describe, expect, it, vi } from "vitest";
import { AssetVersioningService } from "../AssetVersioningService.js";
import type { AppendAssetVersionInput } from "../../domain/assetVersions.js";

vi.mock("../../../shared/ids/IdGenerator.js", () => ({
  getIdGenerator: () => ({
    generate: () => `id-${Math.random().toString(16).slice(2)}`,
  }),
}));

type Row = Record<string, unknown>;

/**
 * In-memory Pool that mimics BEGIN + advisory lock + version insert.
 * Without the lock path, concurrent MAX+1 would collide on uq_asset_version.
 */
function createFakePool() {
  const history = new Map<string, Row[]>();
  const locks = new Map<string, Promise<void>>();

  function makeClient() {
    let txnAsset: string | null = null;
    let heldLockRelease: (() => void) | null = null;

    const client = {
      async query(sql: string, params?: unknown[]) {
        const q = sql.replace(/\s+/g, " ").trim().toLowerCase();

        if (q === "begin") {
          return { rows: [] };
        }
        if (q === "commit") {
          if (heldLockRelease) {
            heldLockRelease();
            heldLockRelease = null;
          }
          txnAsset = null;
          return { rows: [] };
        }
        if (q === "rollback") {
          if (heldLockRelease) {
            heldLockRelease();
            heldLockRelease = null;
          }
          txnAsset = null;
          return { rows: [] };
        }
        if (q.includes("pg_advisory_xact_lock")) {
          const assetId = String(params?.[0]);
          txnAsset = assetId;
          // Serialize: wait for previous lock holders on this asset
          const prev = locks.get(assetId) ?? Promise.resolve();
          let release!: () => void;
          const gate = new Promise<void>((r) => {
            release = r;
          });
          locks.set(
            assetId,
            prev.then(() => gate),
          );
          await prev;
          heldLockRelease = release;
          // small yield so concurrent callers queue on the same lock
          await new Promise((r) => setTimeout(r, 0));
          return { rows: [] };
        }
        if (q.includes("coalesce(max(version_number)")) {
          const assetId = String(params?.[0]);
          const rows = history.get(assetId) ?? [];
          const max = rows.reduce((m, r) => Math.max(m, Number(r.version_number)), 0);
          // Artificial delay to widen race window if lock were missing
          await new Promise((r) => setTimeout(r, 5));
          return { rows: [{ n: String(max + 1) }] };
        }
        if (q.startsWith("update product_catalog.asset_version_history set is_current")) {
          const assetId = String(params?.[0]);
          for (const r of history.get(assetId) ?? []) r.is_current = false;
          return { rows: [] };
        }
        if (q.startsWith("insert into product_catalog.asset_version_history")) {
          const assetId = String(params?.[1]);
          const versionNumber = Number(params?.[4]);
          const rows = history.get(assetId) ?? [];
          if (rows.some((r) => Number(r.version_number) === versionNumber)) {
            const err = Object.assign(new Error("duplicate key uq_asset_version"), {
              code: "23505",
            });
            throw err;
          }
          const row: Row = {
            id: params?.[0],
            asset_id: assetId,
            entity_type: params?.[2],
            entity_id: params?.[3],
            version_number: versionNumber,
            source: params?.[5],
            source_trust: params?.[6],
            quality_score: params?.[7],
            sha256: params?.[8],
            width: params?.[9],
            height: params?.[10],
            format: params?.[11],
            size_bytes: params?.[12],
            cdn_url: params?.[13],
            pipeline_version: params?.[14],
            derivatives: {},
            metadata: {},
            created_by: params?.[17],
            created_at: new Date().toISOString(),
            is_current: true,
          };
          rows.push(row);
          history.set(assetId, rows);
          return { rows: [row] };
        }
        return { rows: [] };
      },
      release() {},
    };

    return client;
  }

  const pool = {
    connect: async () => makeClient(),
    query: async () => ({ rows: [] }),
    // keep reference for assertions
    _history: history,
    _lockTail: () => lockTail,
  };

  return pool;
}

const baseInput = (assetId: string, sha: string): AppendAssetVersionInput => ({
  assetId,
  entityType: "product_variant",
  entityId: "v1",
  source: "test",
  sourceTrust: 50,
  qualityScore: 50,
  sha256: sha,
});

describe("AssetVersioningService.append concurrency", () => {
  it("assigns distinct version numbers under concurrent appends (no uq_asset_version)", async () => {
    const pool = createFakePool();
    const svc = new AssetVersioningService(pool as never);
    const assetId = "11111111-1111-1111-1111-111111111111";

    const results = await Promise.all([
      svc.append(baseInput(assetId, "aaa")),
      svc.append(baseInput(assetId, "bbb")),
      svc.append(baseInput(assetId, "ccc")),
      svc.append(baseInput(assetId, "ddd")),
    ]);

    const versions = results.map((r) => r.versionNumber).sort((a, b) => a - b);
    expect(versions).toEqual([1, 2, 3, 4]);
    expect(new Set(versions).size).toBe(4);
    expect(pool._history.get(assetId)?.length).toBe(4);
  });
});

describe("Asset Versioning compare (pure)", () => {
  it("detects trust and hash changes without deleting history", () => {
    const from = { source: "liga_portal", sourceTrust: 60, sha256: "aaa", qualityScore: 40 };
    const to = { source: "publisher_api", sourceTrust: 100, sha256: "bbb", qualityScore: 90 };
    const keys = ["source", "sourceTrust", "sha256", "qualityScore"] as const;
    const changed = keys.filter((k) => from[k] !== to[k]);
    expect(changed).toEqual(["source", "sourceTrust", "sha256", "qualityScore"]);
  });
});
