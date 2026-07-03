import { describe, expect, it } from "vitest";
import { dashboardOverviewMock } from "@/lib/seller-dashboard-overview-mock";
import { buildSellerOrdersQuery, ORDER_TABS, parseOrderTab } from "@/lib/seller-orders-query";
import { SIDEBAR_ITEMS, sidebarItemActive } from "@/lib/seller-sidebar-nav";

describe("dashboardOverviewMock", () => {
  it("returns metrics with pending payment count", () => {
    const data = dashboardOverviewMock();
    expect(data.metrics.pending_payment).toBe(12);
    expect(data.recent_orders.length).toBeGreaterThan(0);
  });
});

describe("parseOrderTab", () => {
  it("defaults to all for unknown tab", () => {
    expect(parseOrderTab(null)).toBe("all");
    expect(parseOrderTab("invalid")).toBe("all");
  });

  it("parses pending_payment tab", () => {
    expect(parseOrderTab("pending_payment")).toBe("pending_payment");
  });
});

describe("buildSellerOrdersQuery", () => {
  it("includes tab and search params", () => {
    const qs = buildSellerOrdersQuery(2, 25, {
      tab: "to_separate",
      search: "18555",
      paymentMethod: "pix",
    });
    expect(qs).toContain("tab=to_separate");
    expect(qs).toContain("search=18555");
    expect(qs).toContain("payment_method=pix");
    expect(qs).toContain("page=2");
  });
});

describe("seller sidebar navigation", () => {
  it("has flow-based top-level modules", () => {
    const ids = SIDEBAR_ITEMS.map((i) => i.id);
    expect(ids).toContain("catalog");
    expect(ids).toContain("orders");
    expect(ids).toContain("support");
  });

  it("marks dashboard root as active only on exact path", () => {
    expect(sidebarItemActive("/vendedor/painel", "/vendedor/painel")).toBe(true);
    expect(sidebarItemActive("/vendedor/painel/pedidos", "/vendedor/painel")).toBe(false);
  });

  it("defines order tabs labels", () => {
    expect(ORDER_TABS.find((t) => t.id === "pending_payment")?.label).toBe(
      "Aguardando pagamento",
    );
  });
});
