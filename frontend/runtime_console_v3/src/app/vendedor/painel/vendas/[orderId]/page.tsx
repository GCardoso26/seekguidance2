"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { SaleStatusBadge } from "@/components/seller-dashboard/SaleStatusBadge";
import { OrderActions } from "@/components/store/OrderActions";
import { formatShopPrice } from "@/lib/marketplace-shop";

export default function VendaDetalhePage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["seller-order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/seller/orders/${encodeURIComponent(orderId)}`);
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
  });

  const order = data?.order as Record<string, unknown> | undefined;

  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <Link href="/vendedor/painel/vendas" className="text-sm text-luxury-mist hover:underline">
          ← Voltar às vendas
        </Link>
        {isLoading && <p className="text-luxury-mist">Carregando…</p>}
        {order && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-lg">#{String(order.id).slice(0, 8)}</h2>
              <SaleStatusBadge status={String(order.status)} />
              <span className="font-semibold">{formatShopPrice(Number(order.total_cents ?? 0))}</span>
            </div>
            {Boolean(order.tracking_code) && (
              <p className="mt-2 text-sm text-luxury-mist">Rastreio: {String(order.tracking_code)}</p>
            )}
            <OrderActions
              orderId={String(order.id)}
              status={String(order.status)}
              paymentMethod={order.payment_method as string | undefined}
              pixTxid={order.pix_txid as string | undefined}
              onUpdated={() => void refetch()}
            />
          </div>
        )}
      </main>
    </>
  );
}
