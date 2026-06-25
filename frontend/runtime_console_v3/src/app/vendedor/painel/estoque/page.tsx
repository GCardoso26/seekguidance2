"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useSellerStore } from "@/hooks/useSellerStore";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EstoquePage() {
  const { storeId, hasStore, isLoading } = useSellerStore();

  const { data, isLoading: loadingInv } = useQuery({
    queryKey: ["seller-inventory", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/inventory`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  if (isLoading) {
    return <main className="p-8 text-luxury-mist">Carregando…</main>;
  }
  if (!hasStore) {
    return (
      <main className="p-8 text-center">
        <p className="text-luxury-mist">Cadastre uma loja primeiro.</p>
        <Link href="/stores/create" className="mt-4 inline-block text-luxury-gold underline">
          Criar loja
        </Link>
      </main>
    );
  }

  const products = data?.products ?? {};
  const listings = data?.listings ?? {};
  const lowStock = (data?.low_stock_products ?? []) as Array<Record<string, unknown>>;

  return (
    <>
      <SellerHeader />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-xl font-bold">Estoque</h2>
          <p className="text-sm text-luxury-mist">Produtos físicos e listagens de cartas.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Produtos ativos", value: products.active_products ?? products.total_products ?? 0 },
            { label: "Sem estoque", value: products.out_of_stock ?? 0 },
            { label: "Estoque baixo", value: products.low_stock ?? 0 },
            { label: "Valor em estoque", value: formatBRL(Number(products.inventory_value_cents ?? 0)) },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-luxury-mist">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-semibold">Listagens de cartas</h3>
          <p className="mt-2 text-sm text-luxury-mist">
            {listings.active_listings ?? 0} listagens ativas · {listings.total_cards ?? 0} cartas ·{" "}
            {formatBRL(Number(listings.listings_value_cents ?? 0))} em valor
          </p>
          <Link href="/vendedor/painel/listagens" className="mt-3 inline-block text-sm text-luxury-gold underline">
            Gerenciar listagens
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">Produtos com estoque baixo</h3>
          {loadingInv ? (
            <p className="text-sm text-luxury-mist">Carregando…</p>
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-luxury-mist">Nenhum produto com estoque crítico.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {lowStock.map((p) => (
                <li key={String(p.id)} className="flex justify-between py-2 text-sm">
                  <span>{String(p.name)}</span>
                  <span className="text-amber-300">{String(p.stock)} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
