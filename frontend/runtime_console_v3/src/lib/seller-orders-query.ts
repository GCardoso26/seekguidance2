/** Abas de pedidos do painel lojista (flow-based). */

export type OrderTabId =
  | "all"
  | "pending_payment"
  | "paid"
  | "to_separate"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type OrderTab = {
  id: OrderTabId;
  label: string;
  href: string;
};

export const ORDER_TABS: OrderTab[] = [
  { id: "all", label: "Todos", href: "/vendedor/painel/pedidos?tab=all" },
  { id: "pending_payment", label: "Aguardando pagamento", href: "/vendedor/painel/pedidos?tab=pending_payment" },
  { id: "paid", label: "Pagos", href: "/vendedor/painel/pedidos?tab=paid" },
  { id: "to_separate", label: "Separação", href: "/vendedor/painel/pedidos?tab=to_separate" },
  { id: "shipped", label: "Enviados", href: "/vendedor/painel/pedidos?tab=shipped" },
  { id: "delivered", label: "Entregues", href: "/vendedor/painel/pedidos?tab=delivered" },
  { id: "cancelled", label: "Cancelados", href: "/vendedor/painel/pedidos?tab=cancelled" },
  { id: "refunded", label: "Reembolsos", href: "/vendedor/painel/pedidos?tab=refunded" },
];

export function parseOrderTab(raw: string | null | undefined): OrderTabId {
  const valid = ORDER_TABS.map((t) => t.id);
  if (raw && valid.includes(raw as OrderTabId)) return raw as OrderTabId;
  return "all";
}

/** Query string para GET /api/seller/orders com paginação e filtros. */

export function buildSellerOrdersQuery(
  page: number,
  limit: number,
  options?: {
    tab?: OrderTabId;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    minValue?: number;
    maxValue?: number;
    paymentMethod?: string;
  },
): string {
  const safePage = Math.max(1, page);
  const params = new URLSearchParams({
    page: String(safePage),
    limit: String(limit),
  });

  if (options?.tab && options.tab !== "all") {
    params.set("tab", options.tab);
  } else if (options?.status) {
    params.set("status", options.status);
  }

  if (options?.search?.trim()) params.set("search", options.search.trim());
  if (options?.dateFrom) params.set("date_from", options.dateFrom);
  if (options?.dateTo) params.set("date_to", options.dateTo);
  if (options?.minValue != null) params.set("min_value", String(options.minValue));
  if (options?.maxValue != null) params.set("max_value", String(options.maxValue));
  if (options?.paymentMethod) params.set("payment_method", options.paymentMethod);

  return params.toString();
}
