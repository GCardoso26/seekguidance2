import { describe, expect, it } from "vitest";
import { FEATURES, isFeatureEnabled } from "@/lib/feature-flags";
import {
  sellerGlobalSearchMock,
  sellerHeaderNotificationsMock,
} from "@/lib/seller-global-search-mock";

describe("feature flags", () => {
  it("enables global search by default", () => {
    expect(isFeatureEnabled("GLOBAL_SEARCH")).toBe(true);
    expect(FEATURES.HEADER_NOTIFICATIONS).toBe(true);
  });

  it("includes sprint 3 modules", () => {
    expect(FEATURES.TICKETS).toBe(true);
    expect(FEATURES.TEAM_RBAC).toBe(true);
    expect(FEATURES.FINANCE_DASHBOARD).toBe(true);
  });
});

describe("useGlobalSearch mock", () => {
  it("returns orders for query 185", () => {
    const data = sellerGlobalSearchMock("185");
    expect(data.categories.orders?.length).toBeGreaterThan(0);
    expect(data.categories.orders?.[0]?.title).toContain("#");
  });

  it("returns empty for short query", () => {
    const data = sellerGlobalSearchMock("a");
    expect(data.total).toBe(0);
  });

  it("includes customer João Silva", () => {
    const data = sellerGlobalSearchMock("joao");
    const names = data.categories.customers?.map((c) => c.title) ?? [];
    expect(names.some((n) => n.includes("João"))).toBe(true);
  });
});

describe("useHeaderNotifications mock", () => {
  it("returns badge count 12", () => {
    const data = sellerHeaderNotificationsMock();
    expect(data.total_unread).toBe(12);
  });

  it("includes new orders category", () => {
    const data = sellerHeaderNotificationsMock();
    const orders = data.categories.find((c) => c.type === "new_orders");
    expect(orders?.label).toContain("novos pedidos");
  });
});
