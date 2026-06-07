import { describe, expect, it } from "vitest";
import { tierToStripe } from "@/lib/stripe/prices";

describe("stripe prices", () => {
  it("mapeia pro para spike no backend", () => {
    expect(tierToStripe("pro")).toBe("spike");
    expect(tierToStripe("team")).toBe("team");
  });
});
