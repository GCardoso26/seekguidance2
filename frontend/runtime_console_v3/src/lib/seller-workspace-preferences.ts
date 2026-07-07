export type DashboardWidgetId =
  | "command_center"
  | "kpi_strip"
  | "health"
  | "reputation"
  | "sla"
  | "orders_stock"
  | "quick_actions";

export type TableDensity = "comfortable" | "compact";

export type DefaultLanding = "/vendedor/painel" | "/vendedor/painel/operacao";

export type WorkspacePreferences = {
  widgetOrder: DashboardWidgetId[];
  hiddenWidgets: DashboardWidgetId[];
  pinnedWidgets: DashboardWidgetId[];
  defaultLanding: DefaultLanding;
  tableDensity: TableDensity;
};

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  command_center: "Centro de comando",
  kpi_strip: "Indicadores (KPIs)",
  health: "Saúde da loja",
  reputation: "Reputação",
  sla: "SLA de envio",
  orders_stock: "Pedidos e estoque",
  quick_actions: "Ações rápidas",
};

export const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  "command_center",
  "kpi_strip",
  "health",
  "reputation",
  "sla",
  "orders_stock",
  "quick_actions",
];

const STORAGE_KEY = "judgetcg-seller-workspace-v1";

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  widgetOrder: [...DEFAULT_WIDGET_ORDER],
  hiddenWidgets: [],
  pinnedWidgets: ["command_center"],
  defaultLanding: "/vendedor/painel",
  tableDensity: "comfortable",
};

export function loadWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<WorkspacePreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      widgetOrder: parsed.widgetOrder ?? DEFAULT_PREFERENCES.widgetOrder,
      hiddenWidgets: parsed.hiddenWidgets ?? [],
      pinnedWidgets: parsed.pinnedWidgets ?? DEFAULT_PREFERENCES.pinnedWidgets,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveWorkspacePreferences(prefs: WorkspacePreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function visibleWidgetOrder(prefs: WorkspacePreferences): DashboardWidgetId[] {
  const pinned = prefs.pinnedWidgets.filter((id) => !prefs.hiddenWidgets.includes(id));
  const rest = prefs.widgetOrder.filter(
    (id) => !prefs.hiddenWidgets.includes(id) && !pinned.includes(id),
  );
  return [...pinned, ...rest];
}
