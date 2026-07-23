"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { EscrowBadge } from "@/components/escrow/EscrowBadge";
import { EscrowTimeline } from "@/components/escrow/EscrowTimeline";
import { DisputeForm } from "@/components/escrow/DisputeForm";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { EscrowStatus } from "@/lib/escrow/types";
import { invalidateAfterPurchase } from "@/lib/player-journey";
import { Loader2 } from "lucide-react";

interface OrderDetail {
  order: Record<string, unknown> & {
    id: string;
    status: string;
    total_cents: number;
    store_name?: string;
    use_escrow?: boolean;
    items?: Array<{ product_name: string; quantity: number; total_price_cents: number }>;
    escrow?: {
      id: string;
      status: EscrowStatus;
      escrow_fee_cents: number;
      auto_release_at?: string;
    };
  };
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = String(params.orderId);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shop-order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/orders/${orderId}`);
      if (!res.ok) throw new Error("not_found");
      return res.json() as Promise<OrderDetail>;
    },
  });

  const order = data?.order;
  const escrow = order?.escrow;
  const canConfirm = escrow && ["shipped", "delivered"].includes(escrow.status);
  const canDispute = escrow && ["payment_received", "shipped", "delivered"].includes(escrow.status);

  async function confirmDelivery() {
    if (!escrow) return;
    const res = await fetch(`/api/marketplace/shop/escrow/${escrow.id}/confirm`, { method: "POST" });
    if (res.ok) {
      invalidateAfterPurchase(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["shop-order", orderId] });
    }
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  if (error || !order) {
    return (
      <MobileLayout>
        <p className="p-8 text-muted-foreground">Pedido não encontrado.</p>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/marketplace/orders" className="text-sm text-muted-foreground">
          ← Meus pedidos
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
        <p className="text-muted-foreground">{order.store_name}</p>
        <p className="mt-2 text-xl font-semibold text-success">
          {formatShopPrice(order.total_cents)}
        </p>

        {escrow && (
          <div className="mt-6 space-y-4">
            <EscrowBadge status={escrow.status} />
            <EscrowTimeline status={escrow.status} />
            {escrow.auto_release_at && (
              <p className="text-xs text-muted-foreground">
                Pagamento ao vendedor após confirmação:{" "}
                {new Date(escrow.auto_release_at).toLocaleString("pt-BR")}
              </p>
            )}
            {canConfirm && (
              <button
                type="button"
                onClick={() => void confirmDelivery()}
                className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-foreground"
              >
                Confirmar recebimento
              </button>
            )}
            {canDispute && (
              <DisputeForm
                escrowId={escrow.id}
                onSuccess={() => {
                  void queryClient.invalidateQueries({ queryKey: ["shop-order", orderId] });
                }}
              />
            )}
          </div>
        )}

        <ul className="mt-8 space-y-2">
          {(order.items ?? []).map((item, i) => (
            <li key={i} className="flex justify-between text-sm border-b border-border/60 py-2">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{formatShopPrice(item.total_price_cents)}</span>
            </li>
          ))}
        </ul>

        {order.status === "delivered" && !escrow && (
          <Link
            href={`/pedidos/${order.id}/avaliar`}
            className="mt-6 inline-block text-primary underline"
          >
            Avaliar compra
          </Link>
        )}
      </div>
    </MobileLayout>
  );
}
