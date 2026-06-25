import { describe, expect, it } from "vitest";
import { getRateLimitTier } from "@/lib/rate-limit-redis";

describe("getRateLimitTier", () => {
  it("returns search for catalog search path", () => {
    const req = new Request("https://judgetcg.com.br/api/catalog/cards/search?q=bolt");
    expect(getRateLimitTier(req)).toBe("search");
  });

  it("returns authenticated when Bearer token present", () => {
    const req = new Request("https://judgetcg.com.br/api/catalog/cards/search", {
      headers: { Authorization: "Bearer token123" },
    });
    expect(getRateLimitTier(req)).toBe("authenticated");
  });

  it("returns checkout for checkout paths", () => {
    const req = new Request("https://judgetcg.com.br/api/checkout/initiate");
    expect(getRateLimitTier(req)).toBe("checkout");
  });

  it("returns public for generic API", () => {
    const req = new Request("https://judgetcg.com.br/api/catalog/health");
    expect(getRateLimitTier(req)).toBe("public");
  });
});
