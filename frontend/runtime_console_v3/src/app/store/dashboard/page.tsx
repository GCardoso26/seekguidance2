"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { StoreDashboard } from "@/components/store/StoreDashboard";
import { StripeConnectPanel } from "@/components/store/StripeConnectPanel";
import { ProductForm, type ProductFormValues } from "@/components/store/ProductForm";

type DashboardTab = "overview" | "products" | "settings";

function tabFromParam(value: string | null): DashboardTab {
  if (value === "products" || value === "produtos") return "products";
  if (value === "stripe" || value === "settings" || value === "pagamentos") return "settings";
  return "overview";
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding");
  const tabParam = searchParams.get("tab");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [tab, setTab] = useState<DashboardTab>(() => tabFromParam(tabParam));

  useEffect(() => {
    setTab(tabFromParam(tabParam));
  }, [tabParam]);

  const { data: storesData, isLoading: storesLoading } = useQuery({
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

  const {
    data: dashboard,
    refetch: refetchDashboard,
    isLoading: dashboardLoading,
  } = useQuery({
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

  useEffect(() => {
    if (!storeId || onboarding !== "success") return;
    void (async () => {
      await fetch(`/api/marketplace/shop/connect/refresh/${encodeURIComponent(storeId)}`, { method: "POST" });
      await refetchDashboard();
    })();
  }, [storeId, onboarding, refetchDashboard]);

  useEffect(() => {
    const store = dashboard?.store as Record<string, unknown> | undefined;
    if (!storeId || !store?.stripe_account_id || store.stripe_onboarding_complete === true) return;
    void (async () => {
      await fetch(`/api/marketplace/shop/connect/refresh/${encodeURIComponent(storeId)}`, { method: "POST" });
      await refetchDashboard();
    })();
  }, [storeId, dashboard?.store, refetchDashboard]);

  function selectTab(next: DashboardTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("tab");
    } else if (next === "products") {
      params.set("tab", "products");
    } else {
      params.set("tab", "stripe");
    }
    const qs = params.toString();
    router.replace(qs ? `/store/dashboard?${qs}` : "/store/dashboard", { scroll: false });
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

  if (storesLoading) {
    return <p className="text-luxury-mist">Carregando loja…</p>;
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
  const stripePending = store?.stripe_onboarding_complete !== true;

  return (
    <div className="space-y-6">
      {onboarding === "success" && (
        <div className="rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-4 text-sm">
          Onboarding Stripe concluído! Sua loja já pode receber pagamentos.
        </div>
      )}

      {tab === "overview" && stripePending && (
        <StripeConnectPanel
          variant="banner"
          storeId={storeId}
          store={store}
          loading={dashboardLoading}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "overview" as const, label: "Pedidos" },
            { id: "products" as const, label: "Produtos" },
            { id: "settings" as const, label: "Stripe", highlight: stripePending },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-full px-4 py-1 text-sm ${
              tab === t.id ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"
            } ${"highlight" in t && t.highlight && tab !== t.id ? "ring-1 ring-luxury-gold/50" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && dashboardLoading && !store && (
        <p className="text-luxury-mist">Carregando pedidos…</p>
      )}

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
          {stripePending && (
            <div className="lg:col-span-2">
              <StripeConnectPanel variant="banner" storeId={storeId} store={store} loading={dashboardLoading} />
            </div>
          )}
          <ProductForm onSubmit={createProduct} submitLabel="Adicionar produto" />
          <div className="space-y-3">
            <h2 className="font-semibold">Seus produtos</h2>
            {(productsData?.products ?? []).map((p: Record<string, unknown>) => (
              <div key={String(p.id)} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                <p className="font-medium">{String(p.name)}</p>
                <p className="text-luxury-mist">
                  Estoque: {Number(p.stock)} · {p.is_active ? "Ativo" : "Inativo"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <StripeConnectPanel storeId={storeId} store={store} loading={dashboardLoading} />
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
