import { describe, expect, it } from "vitest";
import { buildSellerOrdersQuery } from "@/lib/seller-orders-query";

describe("buildSellerOrdersQuery", () => {
  it("monta page e limit", () => {
    expect(buildSellerOrdersQuery(2, 20)).toBe("page=2&limit=20");
  });

  it("inclui tab quando informada", () => {
    expect(buildSellerOrdersQuery(1, 10, { tab: "pending_payment" })).toBe(
      "page=1&limit=10&tab=pending_payment",
    );
  });

  it("normaliza página mínima", () => {
    expect(buildSellerOrdersQuery(0, 10)).toBe("page=1&limit=10");
  });
});
