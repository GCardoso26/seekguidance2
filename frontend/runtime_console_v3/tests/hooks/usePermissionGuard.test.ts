import { describe, expect, it } from "vitest";
import {
  hasPermission,
  mergePermissions,
  ROLE_DEFAULTS,
  ROLE_LABELS,
} from "@/lib/seller-rbac";
import { sellerTeamUsersMock } from "@/lib/seller-team-mock";
import { sellerFinanceRevenueMock } from "@/lib/seller-finance-mock";

describe("seller RBAC", () => {
  it("store_owner has all finance permissions", () => {
    expect(hasPermission("store_owner", null, "finance", "export")).toBe(true);
  });

  it("operator cannot view finance", () => {
    expect(hasPermission("operator", null, "finance", "view")).toBe(false);
  });

  it("manager can view and export finance", () => {
    const perms = ROLE_DEFAULTS.manager;
    expect(hasPermission("manager", perms, "finance", "view")).toBe(true);
    expect(hasPermission("manager", perms, "finance", "export")).toBe(true);
  });

  it("mergePermissions applies override", () => {
    const merged = mergePermissions("support", { orders: { edit: true } });
    expect(merged.orders.edit).toBe(true);
  });

  it("has labels for all roles", () => {
    expect(ROLE_LABELS.manager).toBe("Gerente");
    expect(ROLE_LABELS.stock_keeper).toBe("Estoquista");
  });
});

describe("seller team mock", () => {
  it("includes Ana Paula as manager", () => {
    const users = sellerTeamUsersMock().users;
    const ana = users.find((u) => u.display_name === "Ana Paula");
    expect(ana?.role).toBe("manager");
  });

  it("owner is first user", () => {
    const users = sellerTeamUsersMock().users;
    expect(users[0].is_owner).toBe(true);
  });
});

describe("seller finance mock", () => {
  it("returns revenue rows with net less than gross", () => {
    const data = sellerFinanceRevenueMock();
    expect(data.rows.length).toBeGreaterThan(0);
    expect(data.totals.net_cents).toBeLessThan(data.totals.gross_cents);
  });

  it("totals sum rows", () => {
    const data = sellerFinanceRevenueMock();
    const orders = data.rows.reduce((s, r) => s + r.orders, 0);
    expect(data.totals.orders).toBe(orders);
  });
});
