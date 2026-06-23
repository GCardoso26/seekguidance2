"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { formatShopPrice } from "@/lib/marketplace-shop";

export default function MyOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-shop-orders"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/shop/orders");
      if (!res.ok) return { orders: [] };
      return res.json() as Promise<{ orders: Array<Record<string, unknown>> }>;
    },
  });

  const orders = data?.orders ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/marketplace" className="text-sm text-luxury-mist">
          ← Marketplace
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Meus pedidos</h1>
        {isLoading && <p className="mt-4 text-luxury-mist">Carregando…</p>}
        <div className="mt-6 space-y-3">
          {orders.length === 0 && !isLoading && (
            <p className="text-luxury-mist">Nenhum pedido ainda.</p>
          )}
          {orders.map((o) => (
            <div key={String(o.id)} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-mono text-sm">#{String(o.id).slice(0, 8)}</span>
                <span className="text-xs uppercase text-luxury-mist">{String(o.status)}</span>
                <span className="font-semibold">{formatShopPrice(Number(o.total_cents))}</span>
              </div>
              <p className="mt-1 text-sm text-luxury-mist">{String(o.store_name ?? "")}</p>
              {String(o.status) === "delivered" && (
                <Link
                  href={`/pedidos/${String(o.id)}/avaliar`}
                  className="mt-3 inline-block text-sm text-luxury-gold underline"
                >
                  Avaliar compra
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
