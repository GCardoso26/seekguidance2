"use client";

import { memo } from "react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { OrderActions } from "@/components/store/OrderActions";

export type StoreOrder = {
  id: string;
  status: string;
  total_cents: number;
  payment_method?: string;
  pix_txid?: string;
  tracking_code?: string;
  created_at?: string;
  items?: Array<{ product_name: string; quantity: number }>;
};

type Props = {
  orders: StoreOrder[];
  onUpdated: () => void;
};

const OrderRow = memo(function OrderRow({
  order,
  onUpdated,
}: {
  order: StoreOrder;
  onUpdated: () => void;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">{order.status}</span>
        <span className="font-semibold">{formatShopPrice(order.total_cents)}</span>
      </div>
      {order.tracking_code && (
        <p className="mt-1 text-xs text-muted-foreground">Rastreio: {order.tracking_code}</p>
      )}
      {order.items && order.items.length > 0 && (
        <ul className="mt-2 text-sm text-muted-foreground">
          {order.items.map((item, i) => (
            <li key={`${order.id}-${i}`}>
              {item.quantity}x {item.product_name}
            </li>
          ))}
        </ul>
      )}
      <OrderActions
        orderId={order.id}
        status={order.status}
        paymentMethod={order.payment_method}
        pixTxid={order.pix_txid}
        onUpdated={onUpdated}
      />
    </div>
  );
});

export function OrdersList({ orders, onUpdated }: Props) {
  if (orders.length === 0) {
    return <p className="text-muted-foreground">Nenhum pedido encontrado.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
