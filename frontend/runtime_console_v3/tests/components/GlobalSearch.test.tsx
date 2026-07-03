import { describe, expect, it } from "vitest";
import { sellerGlobalSearchMock } from "@/lib/seller-global-search-mock";

describe("GlobalSearch component data", () => {
  it("groups results by category", () => {
    const data = sellerGlobalSearchMock("bolt");
    expect(data.categories.listings?.length).toBeGreaterThan(0);
  });

  it("lists coupons when matching", () => {
    const data = sellerGlobalSearchMock("CUPOM");
    expect(data.categories.coupons?.[0]?.title).toBe("CUPOM10");
  });
});
