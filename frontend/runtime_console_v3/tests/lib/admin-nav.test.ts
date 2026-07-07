import { describe, expect, it } from "vitest";
import { adminPanelBreadcrumbs } from "@/lib/admin-breadcrumbs";
import { adminSidebarItemActive } from "@/lib/admin-sidebar-nav";

describe("adminSidebarItemActive", () => {
  it("marca /admin só na raiz", () => {
    expect(adminSidebarItemActive("/admin", "/admin")).toBe(true);
    expect(adminSidebarItemActive("/admin/dashboard", "/admin")).toBe(false);
  });

  it("marca subrotas do item", () => {
    expect(adminSidebarItemActive("/admin/catalog", "/admin/catalog")).toBe(true);
    expect(adminSidebarItemActive("/admin/catalog/extra", "/admin/catalog")).toBe(true);
  });
});

describe("adminPanelBreadcrumbs", () => {
  it("gera trilha para analytics", () => {
    const items = adminPanelBreadcrumbs("/admin/analytics");
    expect(items.map((i) => i.label)).toEqual(["Início", "Admin", "Analytics"]);
  });
});
