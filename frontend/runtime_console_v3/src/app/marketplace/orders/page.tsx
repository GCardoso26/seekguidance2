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
        <Link href="/loja" className="text-sm text-muted-foreground">
          ← Marketplace
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Meus pedidos</h1>
        {isLoading && <p className="mt-4 text-muted-foreground">Carregando…</p>}
        <div className="mt-6 space-y-3">
          {orders.length === 0 && !isLoading && (
            <p className="text-muted-foreground">Nenhum pedido ainda.</p>
          )}
          {orders.map((o) => (
            <Link
              key={String(o.id)}
              href={`/marketplace/orders/${String(o.id)}`}
              className="block surface-card p-4 hover:bg-muted"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-mono text-sm">#{String(o.id).slice(0, 8)}</span>
                <span className="text-xs uppercase text-muted-foreground">{String(o.status)}</span>
                <span className="font-semibold">{formatShopPrice(Number(o.total_cents))}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{String(o.store_name ?? "")}</p>
              {Boolean(o.use_escrow) && (
                <span className="mt-2 inline-block text-xs text-success">Compra Protegida</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
