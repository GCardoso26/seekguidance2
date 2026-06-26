import { describe, expect, it } from "vitest";
import { buildSellerListingsQuery } from "@/lib/seller-listings-query";

describe("buildSellerListingsQuery", () => {
  it("monta page e limit", () => {
    expect(buildSellerListingsQuery(2, 24)).toBe("page=2&limit=24");
  });

  it("normaliza página mínima", () => {
    expect(buildSellerListingsQuery(0, 10)).toBe("page=1&limit=10");
  });
});
