import { describe, expect, it } from "vitest";
import {
  isSoftProductCatalogSyncError,
  isTransientUpstreamSyncError,
  productCatalogSyncJobOk,
  partitionProductCatalogSyncErrors,
} from "../syncErrorPolicy.js";

describe("syncErrorPolicy", () => {
  it("treats pokemon/scryfall 5xx and 429 as soft/transient", () => {
    expect(isTransientUpstreamSyncError("pokemon_tcg_http_500")).toBe(true);
    expect(isTransientUpstreamSyncError("scryfall_http_429")).toBe(true);
    expect(isSoftProductCatalogSyncError("pokemon_tcg_http_500")).toBe(true);
    expect(isSoftProductCatalogSyncError("scryfall_http_400")).toBe(false);
  });

  it("keeps image/knowledge soft without marking as upstream transient", () => {
    expect(isSoftProductCatalogSyncError("image:missing")).toBe(true);
    expect(isTransientUpstreamSyncError("image:missing")).toBe(false);
  });

  it("marks partial success when upserts exist and only upstream flake", () => {
    expect(productCatalogSyncJobOk(939, ["pokemon_tcg_http_500"])).toBe(true);
    expect(productCatalogSyncJobOk(0, ["pokemon_tcg_http_500"])).toBe(false);
    expect(productCatalogSyncJobOk(10, ["persist:boom"])).toBe(false);
  });

  it("partitions hard vs soft", () => {
    const p = partitionProductCatalogSyncErrors([
      "pokemon_tcg_http_500",
      "image:x",
      "persist:fail",
    ]);
    expect(p.hard).toEqual(["persist:fail"]);
    expect(p.transient).toEqual(["pokemon_tcg_http_500"]);
    expect(p.imageKnowledge).toEqual(["image:x"]);
  });
});
