import { describe, expect, it } from "vitest";
import { InMemoryFeatureFlagService } from "../FeatureFlagService.js";

describe("FeatureFlagService", () => {
  it("ON/OFF em memória", async () => {
    const flags = new InMemoryFeatureFlagService({
      checkout_v2: false,
      marketplace_orchestrator: true,
    });
    expect(await flags.isEnabled("checkout_v2")).toBe(false);
    expect(await flags.isEnabled("marketplace_orchestrator")).toBe(true);
    expect(await flags.isEnabled("missing")).toBe(false);
  });
});
