import { describe, expect, it } from "vitest";
import { mergeLorcanaSetsWithSeed } from "../LorcanaJsonSealedProvider.js";

describe("mergeLorcanaSetsWithSeed", () => {
  it("fills ATV when API omits Set 13", () => {
    const api = [{ Set_ID: "WUN", Name: "Wilds Unknown" }];
    const seed = [{ Set_ID: "ATV", Name: "Attack of the Vine!", Release_Date: "2026-07-24" }];
    const merged = mergeLorcanaSetsWithSeed(api, seed);
    const codes = merged.map((r) => String(r.Set_ID));
    expect(codes).toContain("WUN");
    expect(codes).toContain("ATV");
  });

  it("lets API win on Set_ID collision", () => {
    const api = [{ Set_ID: "ATV", Name: "From API" }];
    const seed = [{ Set_ID: "ATV", Name: "From Seed" }];
    const merged = mergeLorcanaSetsWithSeed(api, seed);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.Name).toBe("From API");
  });
});
