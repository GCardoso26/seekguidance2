import type { StoreOrder } from "@/components/store/OrdersList";

/** Pedido normalizado do painel vendedor (API seller/orders). */
export type SellerOrderRow = StoreOrder & {
  buyer_id?: string;
  buyer_name?: string;
};

export function normalizeSellerOrder(raw: Record<string, unknown>): SellerOrderRow {
  return {
    id: String(raw.id ?? ""),
    status: String(raw.status ?? "pending"),
    total_cents: Number(raw.total_cents ?? 0),
    payment_method: raw.payment_method ? String(raw.payment_method) : undefined,
    pix_txid: raw.pix_txid ? String(raw.pix_txid) : undefined,
    tracking_code: raw.tracking_code ? String(raw.tracking_code) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    buyer_id: raw.buyer_id ? String(raw.buyer_id) : undefined,
    buyer_name: raw.buyer_name ? String(raw.buyer_name) : undefined,
    items: Array.isArray(raw.items)
      ? (raw.items as Array<{ product_name: string; quantity: number }>)
      : undefined,
  };
}

export function orderCustomerLabel(order: SellerOrderRow): string {
  if (order.buyer_name) return order.buyer_name;
  if (order.buyer_id) return `#${order.buyer_id.slice(0, 8)}`;
  return "Comprador";
}
