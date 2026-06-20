"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { StoreDashboard } from "@/components/store/StoreDashboard";
import { ProductForm, type ProductFormValues } from "@/components/store/ProductForm";

function DashboardContent() {
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "products" | "settings">("overview");

  const { data: storesData } = useQuery({
    queryKey: ["my-stores"],
    queryFn: async () => {
      const res = await fetch("/api/stores/mine");
      if (!res.ok) return [];
      return res.json() as Promise<Array<Record<string, unknown>>>;
    },
  });

  useEffect(() => {
    if (storesData?.[0]?.id) {
      setStoreId(String(storesData[0].id));
    }
  }, [storesData]);

  const { data: dashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ["store-dashboard", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}`);
      if (!res.ok) throw new Error("Sem acesso");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ["store-orders", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/orders`);
      if (!res.ok) return { orders: [] };
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const { data: productsData, refetch: refetchProducts } = useQuery({
    queryKey: ["store-products-manage", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/products`);
      if (!res.ok) return { products: [] };
      return res.json();
    },
    enabled: Boolean(storeId) && tab === "products",
  });

  async function startStripeOnboarding() {
    const res = await fetch("/api/marketplace/shop/connect/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId }),
    });
    const data = await res.json();
    if (data.onboarding_url) window.location.href = data.onboarding_url;
  }

  async function createProduct(values: ProductFormValues) {
    if (!storeId) return;
    const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(String(err.detail ?? "Falha ao salvar produto"));
    }
    await refetchProducts();
    await refetchDashboard();
  }

  if (!storeId) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-luxury-mist">Você ainda não tem uma loja cadastrada.</p>
        <Link href="/stores/create" className="mt-4 inline-block text-luxury-gold underline">
          Cadastrar loja
        </Link>
      </div>
    );
  }

  const store = dashboard?.store as Record<string, unknown> | undefined;
  const stats = (dashboard?.stats ?? {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      {onboarding === "success" && (
        <div className="rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-4 text-sm">
          Onboarding Stripe concluído! Sua loja já pode receber pagamentos.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["overview", "products", "settings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1 text-sm ${tab === t ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"}`}
          >
            {t === "overview" ? "Visão geral" : t === "products" ? "Produtos" : "Stripe"}
          </button>
        ))}
      </div>

      {tab === "overview" && store && (
        <StoreDashboard
          storeName={String(store.name)}
          stats={stats}
          orders={(ordersData?.orders ?? []) as Array<{
            id: string;
            status: string;
            total_cents: number;
            items?: Array<{ product_name: string; quantity: number }>;
          }>}
          onRefreshOrders={() => void refetchOrders()}
        />
      )}

      {tab === "products" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductForm onSubmit={createProduct} submitLabel="Adicionar produto" />
          <div className="space-y-3">
            <h2 className="font-semibold">Seus produtos</h2>
            {(productsData?.products ?? []).map((p: Record<string, unknown>) => (
              <div key={String(p.id)} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                <p className="font-medium">{String(p.name)}</p>
                <p className="text-luxury-mist">Estoque: {Number(p.stock)} · {p.is_active ? "Ativo" : "Inativo"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold">Stripe Connect</h2>
          <p className="mt-2 text-sm text-luxury-mist">
            {store?.stripe_onboarding_complete
              ? "Conta conectada e pronta para receber pagamentos (split 85% loja / 15% plataforma)."
              : "Complete o onboarding Stripe para vender produtos no marketplace."}
          </p>
          {!store?.stripe_onboarding_complete && (
            <button type="button" onClick={startStripeOnboarding} className="mt-4 rounded-lg bg-luxury-gold px-4 py-2 font-semibold text-luxury-onyx">
              Conectar Stripe
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoreDashboardPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<p className="text-luxury-mist">Carregando…</p>}>
          <DashboardContent />
        </Suspense>
      </div>
    </MobileLayout>
  );
}
