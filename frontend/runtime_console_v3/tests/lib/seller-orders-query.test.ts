import { describe, expect, it } from "vitest";
import { buildSellerOrdersQuery } from "@/lib/seller-orders-query";

describe("buildSellerOrdersQuery", () => {
  it("monta page e limit", () => {
    expect(buildSellerOrdersQuery(2, 20)).toBe("page=2&limit=20");
  });

  it("inclui status quando informado", () => {
    expect(buildSellerOrdersQuery(1, 10, "pending")).toBe("page=1&limit=10&status=pending");
  });

  it("normaliza página mínima", () => {
    expect(buildSellerOrdersQuery(0, 10)).toBe("page=1&limit=10");
  });
});
