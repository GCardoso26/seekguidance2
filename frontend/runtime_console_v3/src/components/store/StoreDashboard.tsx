"use client";

import { formatShopPrice } from "@/lib/marketplace-shop";

type Order = {
  id: string;
  status: string;
  total_cents: number;
  store_receives_cents?: number;
  created_at?: string;
  items?: Array<{ product_name: string; quantity: number }>;
};

type Stats = {
  paid_orders?: number;
  pending_orders?: number;
  revenue_cents?: number;
  product_count?: number;
  active_products?: number;
};

type Props = {
  storeName: string;
  stats: Stats;
  orders: Order[];
  onRefreshOrders?: () => void;
};

export function StoreDashboard({ storeName, stats, orders, onRefreshOrders }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{storeName}</h1>
        <p className="text-sm text-muted-foreground">Dashboard do lojista</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos pagos" value={String(stats.paid_orders ?? 0)} />
        <StatCard label="Pendentes" value={String(stats.pending_orders ?? 0)} />
        <StatCard label="Receita" value={formatShopPrice(Number(stats.revenue_cents ?? 0))} />
        <StatCard label="Produtos ativos" value={String(stats.active_products ?? 0)} />
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedidos recentes</h2>
          {onRefreshOrders && (
            <button type="button" onClick={onRefreshOrders} className="text-sm text-primary">
              Atualizar
            </button>
          )}
        </div>
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-muted-foreground">Nenhum pedido ainda.</p>}
          {orders.map((order) => (
            <div key={order.id} className="surface-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">{order.status}</span>
                <span className="font-semibold">{formatShopPrice(order.total_cents)}</span>
              </div>
              {order.items && order.items.length > 0 && (
                <ul className="mt-2 text-sm text-muted-foreground">
                  {order.items.map((item, i) => (
                    <li key={`${order.id}-${i}`}>
                      {item.quantity}x {item.product_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
