import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURES, FEATURE_LABELS } from "@/lib/subscription/features";

describe("subscription features", () => {
  it("free tier defaults desativam premium", () => {
    expect(DEFAULT_FEATURES.advanced_analytics).toBe(false);
    expect(DEFAULT_FEATURES.api_access).toBe(false);
    expect(DEFAULT_FEATURES.deck_builder).toBe(true);
  });

  it("labels em pt-BR para billing", () => {
    expect(FEATURE_LABELS.tournament_creation).toContain("torneios");
  });
});
