import Link from "next/link";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { SaleStatusBadge } from "./SaleStatusBadge";

type Order = {
  id: string;
  status: string;
  total_cents: number;
  created_at?: string;
  items?: Array<{ product_name: string; quantity: number }>;
};

type Props = {
  orders: Order[];
  viewAllHref?: string;
};

export function RecentSalesTable({ orders, viewAllHref = "/vendedor/painel/vendas" }: Props) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma venda recente.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/vendedor/painel/vendas/${order.id}`}
          className="flex flex-wrap items-center justify-between gap-2 surface-card p-4 hover:bg-muted"
        >
          <div>
            <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
            <p className="text-sm">
              {(order.items ?? [])
                .map((i) => `${i.product_name} ×${i.quantity}`)
                .join(", ") || "Pedido"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SaleStatusBadge status={order.status} />
            <span className="font-semibold">{formatShopPrice(order.total_cents)}</span>
          </div>
        </Link>
      ))}
      <Link href={viewAllHref} className="text-sm text-primary underline">
        Ver todas →
      </Link>
    </div>
  );
}
