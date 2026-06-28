"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { orderCustomerLabel, type SellerOrderRow } from "@/types/seller-order";
import { OrderActions } from "@/components/store/OrderActions";
import { SaleStatusBadge } from "./SaleStatusBadge";

type Props = {
  orders: SellerOrderRow[];
  onUpdated: () => void;
};

function formatOrderDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

export function OrderCards({ orders, onUpdated }: Props) {
  return (
    <ul className="space-y-3" data-testid="order-cards">
      {orders.map((order) => (
        <li key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link
                href={`/vendedor/painel/vendas/${order.id}`}
                className="font-mono text-sm text-luxury-gold hover:underline"
              >
                #{order.id.slice(0, 8)}
              </Link>
              <p className="mt-1 text-sm text-white">{orderCustomerLabel(order)}</p>
              <p className="text-xs text-luxury-mist">{formatOrderDate(order.created_at)}</p>
            </div>
            <div className="text-right">
              <SaleStatusBadge status={order.status} />
              <p className="mt-2 font-semibold text-luxury-gold">{formatShopPrice(order.total_cents)}</p>
            </div>
          </div>
          {order.items && order.items.length > 0 && (
            <ul className="mt-2 text-xs text-luxury-mist">
              {order.items.slice(0, 3).map((item, i) => (
                <li key={`${order.id}-item-${i}`}>
                  {item.quantity}x {item.product_name}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <OrderActions
              orderId={order.id}
              status={order.status}
              paymentMethod={order.payment_method}
              pixTxid={order.pix_txid}
              onUpdated={onUpdated}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrdersEmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed border-white/15 bg-white/5 p-10 text-center"
      data-testid="orders-empty"
    >
      <Package className="mx-auto h-10 w-10 text-luxury-mist/60" aria-hidden />
      <p className="mt-3 font-medium">Nenhum pedido ainda</p>
      <p className="mt-2 text-sm text-luxury-mist">
        Quando você vender, os pedidos aparecerão aqui.
      </p>
    </div>
  );
}
