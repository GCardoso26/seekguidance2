"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
  type DashboardWidgetId,
  type TableDensity,
  type WorkspacePreferences,
  type DefaultLanding,
} from "@/lib/seller-workspace-preferences";

export function useSellerWorkspacePreferences() {
  const [prefs, setPrefs] = useState<WorkspacePreferences>(() => loadWorkspacePreferences());

  useEffect(() => {
    setPrefs(loadWorkspacePreferences());
  }, []);

  const persist = useCallback((next: WorkspacePreferences) => {
    setPrefs(next);
    saveWorkspacePreferences(next);
  }, []);

  const toggleWidget = useCallback(
    (id: DashboardWidgetId) => {
      const hidden = prefs.hiddenWidgets.includes(id)
        ? prefs.hiddenWidgets.filter((w) => w !== id)
        : [...prefs.hiddenWidgets, id];
      persist({ ...prefs, hiddenWidgets: hidden });
    },
    [prefs, persist],
  );

  const togglePin = useCallback(
    (id: DashboardWidgetId) => {
      const pinned = prefs.pinnedWidgets.includes(id)
        ? prefs.pinnedWidgets.filter((w) => w !== id)
        : [...prefs.pinnedWidgets, id];
      persist({ ...prefs, pinnedWidgets: pinned });
    },
    [prefs, persist],
  );

  const moveWidget = useCallback(
    (id: DashboardWidgetId, direction: "up" | "down") => {
      const order = [...prefs.widgetOrder];
      const idx = order.indexOf(id);
      if (idx < 0) return;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= order.length) return;
      [order[idx], order[swap]] = [order[swap], order[idx]];
      persist({ ...prefs, widgetOrder: order });
    },
    [prefs, persist],
  );

  const setDensity = useCallback(
    (tableDensity: TableDensity) => persist({ ...prefs, tableDensity }),
    [prefs, persist],
  );

  const setDefaultLanding = useCallback(
    (defaultLanding: DefaultLanding) => persist({ ...prefs, defaultLanding }),
    [prefs, persist],
  );

  const reset = useCallback(() => {
    const fresh = loadWorkspacePreferences();
    saveWorkspacePreferences({
      ...fresh,
      widgetOrder: [
        "command_center",
        "kpi_strip",
        "health",
        "reputation",
        "sla",
        "orders_stock",
        "quick_actions",
      ],
      hiddenWidgets: [],
      pinnedWidgets: ["command_center"],
      defaultLanding: "/vendedor/painel",
      tableDensity: "comfortable",
    });
    setPrefs(loadWorkspacePreferences());
  }, []);

  return {
    prefs,
    toggleWidget,
    togglePin,
    moveWidget,
    setDensity,
    setDefaultLanding,
    reset,
  };
}
