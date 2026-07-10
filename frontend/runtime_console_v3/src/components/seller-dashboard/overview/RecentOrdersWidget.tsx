"use client";

import Link from "next/link";
import { SaleStatusBadge } from "@/components/seller-dashboard/SaleStatusBadge";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { DashboardRecentOrder } from "@/types/seller-dashboard-overview";

type Props = {
  orders: DashboardRecentOrder[];
  onSelectOrder?: (orderId: string) => void;
};

function orderLabel(order: DashboardRecentOrder): string {
  return order.customer_name?.trim() || "Comprador";
}

function formatShortDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

export function RecentOrdersWidget({ orders, onSelectOrder }: Props) {
  return (
    <section className="surface-card p-4" data-testid="recent-orders-widget">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Pedidos recentes
      </h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido recente.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => onSelectOrder?.(order.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted/80"
              >
                <span className="font-mono text-primary">#{order.id.slice(0, 8)}</span>
                <span className="flex-1 truncate text-muted-foreground">{orderLabel(order)}</span>
                <SaleStatusBadge status={order.status} />
                <span className="tabular-nums text-xs">{formatShopPrice(order.total_cents)}</span>
                <span className="text-xs text-muted-foreground/70">{formatShortDate(order.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/vendedor/painel/pedidos"
        className="mt-3 inline-block text-sm text-primary hover:underline"
      >
        Ver todos os pedidos →
      </Link>
    </section>
  );
}
