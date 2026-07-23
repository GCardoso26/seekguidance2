import { describe, expect, it } from "vitest";
import { JOB_KEY_QUEUE_MAP } from "../../commands/ProductCatalogSyncCommand.js";
import { listProductCatalogJobs } from "../../providers/registry.js";

describe("product catalog ops wiring", () => {
  it("includes sealed in job list", () => {
    expect(listProductCatalogJobs()).toContain("catalog.sync.sealed");
  });

  it("maps sealed job to sealed queue", () => {
    expect(JOB_KEY_QUEUE_MAP["catalog.sync.sealed"]).toBe("catalog.sync.sealed");
  });

  it("remediate job order places sealed before accessories", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../remediate-p0-catalog.ts"),
      "utf8",
    );
    const sealedIdx = src.indexOf('"catalog.sync.sealed"');
    const sleevesIdx = src.indexOf('"catalog.sync.sleeves"');
    expect(sealedIdx).toBeGreaterThan(0);
    expect(sleevesIdx).toBeGreaterThan(sealedIdx);
  });
});
