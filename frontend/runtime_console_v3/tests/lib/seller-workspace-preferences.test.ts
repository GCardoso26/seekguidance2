import { describe, expect, it } from "vitest";
import {
  visibleWidgetOrder,
  DEFAULT_WIDGET_ORDER,
} from "@/lib/seller-workspace-preferences";

describe("seller-workspace-preferences", () => {
  it("pinned widgets aparecem primeiro", () => {
    const order = visibleWidgetOrder({
      widgetOrder: [...DEFAULT_WIDGET_ORDER],
      hiddenWidgets: [],
      pinnedWidgets: ["kpi_strip", "command_center"],
      defaultLanding: "/vendedor/painel",
      tableDensity: "comfortable",
    });
    expect(order[0]).toBe("kpi_strip");
    expect(order[1]).toBe("command_center");
  });

  it("oculta widgets da ordem visível", () => {
    const order = visibleWidgetOrder({
      widgetOrder: [...DEFAULT_WIDGET_ORDER],
      hiddenWidgets: ["sla"],
      pinnedWidgets: [],
      defaultLanding: "/vendedor/painel",
      tableDensity: "compact",
    });
    expect(order).not.toContain("sla");
  });
});
