"use client";

import type { ReactNode } from "react";
import {
  visibleWidgetOrder,
  type DashboardWidgetId,
} from "@/lib/seller-workspace-preferences";
import { useSellerWorkspacePreferences } from "@/hooks/useSellerWorkspacePreferences";

type WidgetMap = Record<DashboardWidgetId, ReactNode>;

type Props = {
  widgets: WidgetMap;
};

export function DashboardWorkspace({ widgets }: Props) {
  const { prefs } = useSellerWorkspacePreferences();
  const order = visibleWidgetOrder(prefs);

  return (
    <>
      {order.map((id) => {
        const node = widgets[id];
        if (!node) return null;
        const pinned = prefs.pinnedWidgets.includes(id);
        return (
          <div
            key={id}
            className={pinned ? "rounded-xl ring-1 ring-primary/30" : undefined}
            data-widget={id}
          >
            {node}
          </div>
        );
      })}
    </>
  );
}
