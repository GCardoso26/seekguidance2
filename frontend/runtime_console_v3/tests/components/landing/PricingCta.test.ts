import { describe, expect, it } from "vitest";
import type { PricingCtaLocation } from "@/lib/analytics";

const VALID_LOCATIONS: PricingCtaLocation[] = [
  "header",
  "hero_secondary",
  "mid_page",
  "final_cta",
  "footer",
];

describe("landing pricing CTA locations", () => {
  it("define 5 posições de tracking", () => {
    expect(VALID_LOCATIONS).toHaveLength(5);
    expect(VALID_LOCATIONS).toContain("header");
    expect(VALID_LOCATIONS).toContain("footer");
  });
});
