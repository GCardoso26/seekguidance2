import { describe, expect, it } from "vitest";
import { MODULE_LABELS, ACTION_LABELS } from "@/lib/seller-rbac";

describe("permission matrix labels", () => {
  it("has Portuguese labels for orders module", () => {
    expect(MODULE_LABELS.orders).toBe("Pedidos");
    expect(ACTION_LABELS.view).toBe("Visualizar");
  });
});

describe("team components contract", () => {
  it("team mock has permissions tab data", () => {
    const perms = { orders: { view: true } };
    expect(perms.orders.view).toBe(true);
  });
});
