"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { StoreDashboard } from "@/components/store/StoreDashboard";
import { OrdersList } from "@/components/store/OrdersList";
import { OrderFilters } from "@/components/store/OrderFilters";
import { StripeConnectPanel } from "@/components/store/StripeConnectPanel";
import { PixConfigForm } from "@/components/store/PixConfigForm";
import { PixWebhookStatus } from "@/components/store/PixWebhookStatus";
import { ProUpgradePanel } from "@/components/store/ProUpgradePanel";
import { StoreReviewsManager } from "@/components/store/StoreReviewsManager";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProStatusWidget } from "@/components/dashboard/ProStatusWidget";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";
import { ProductForm, type ProductFormValues } from "@/components/store/ProductForm";

const SalesChart = dynamic(() => import("@/components/dashboard/SalesChart").then((m) => m.SalesChart), {
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" />,
  ssr: false,
});

type DashboardTab = "overview" | "products" | "settings" | "reviews" | "disputes";

function tabFromParam(value: string | null): DashboardTab {
  if (value === "products" || value === "produtos") return "products";
  if (value === "reviews" || value === "avaliacoes") return "reviews";
  if (value === "disputes" || value === "disputas") return "disputes";
  if (value === "stripe" || value === "settings" || value === "pagamentos" || value === "payments") return "settings";
  return "overview";
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding");
  const tabParam = searchParams.get("tab");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [tab, setTab] = useState<DashboardTab>(() => tabFromParam(tabParam));
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (storesData?.[0]?.id) setStoreId(String(storesData[0].id));
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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ["store-orders", storeId, orderStatusFilter],
    queryFn: async () => {
      const qs = orderStatusFilter ? `?status=${encodeURIComponent(orderStatusFilter)}` : "";
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/orders${qs}`,
      );
      if (!res.ok) return { orders: [] };
      return res.json();
    },
    enabled: Boolean(storeId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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

  function selectTab(next: DashboardTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else if (next === "products") params.set("tab", "products");
    else if (next === "reviews") params.set("tab", "avaliacoes");
    else if (next === "disputes") params.set("tab", "disputas");
    else params.set("tab", "pagamentos");
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

  async function exportOrders() {
    if (!storeId) return;
    window.open(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/orders/export`, "_blank");
  }

  if (storesLoading) return <p className="text-luxury-mist">Carregando loja…</p>;

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
  const revenue = (dashboard?.revenue ?? {}) as Record<string, number>;
  const salesChart = (dashboard?.sales_chart ?? []) as Array<{ day: string; revenue_cents: number }>;
  const plan = String(store?.subscription_plan ?? "free");
  const hasPix = Boolean(store?.pix_key);
  const paymentsPending = !hasPix;

  return (
    <div className="space-y-6">
      {onboarding === "success" && (
        <div className="rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-4 text-sm">
          Onboarding Stripe concluído! Sua loja pode aceitar cartão (opcional).
        </div>
      )}

      {tab === "overview" && paymentsPending && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-sm">
          <p>Configure sua chave PIX para vender no marketplace (zero comissão).</p>
          <button type="button" onClick={() => selectTab("settings")} className="mt-2 text-emerald-300 underline">
            Ir para Pagamentos
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "overview" as const, label: "Pedidos" },
            { id: "products" as const, label: "Produtos" },
            { id: "reviews" as const, label: "Avaliações" },
            { id: "disputes" as const, label: "Disputas" },
            { id: "settings" as const, label: "Pagamentos", highlight: paymentsPending },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-full px-4 py-1 text-sm ${
              tab === t.id ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"
            } ${"highlight" in t && t.highlight && tab !== t.id ? "ring-1 ring-emerald-500/50" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && dashboardLoading && !store && (
        <p className="text-luxury-mist">Carregando pedidos…</p>
      )}

      {tab === "overview" && store && (
        <>
          <ProStatusWidget plan={plan} expiresAt={store.subscription_expires_at as string | undefined} />
          <QuickActions />
          <KpiCards
            revenue={revenue}
            stats={stats}
            averageRating={Number(store.average_rating ?? 0)}
            plan={plan}
          />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">Vendas (30 dias)</h2>
            <SalesChart data={salesChart} />
          </div>
          <StoreDashboard
            storeName={String(store.name)}
            stats={stats}
            orders={(ordersData?.orders ?? []).slice(0, 5)}
            onRefreshOrders={() => void refetchOrders()}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Todos os pedidos</h2>
            <div className="flex flex-wrap gap-2">
              <OrderFilters status={orderStatusFilter} onChange={setOrderStatusFilter} />
              <button type="button" onClick={() => void exportOrders()} className="text-sm text-luxury-gold">
                Exportar CSV
              </button>
            </div>
          </div>
          <OrdersList
            orders={(ordersData?.orders ?? []) as Array<{
              id: string;
              status: string;
              total_cents: number;
              payment_method?: string;
              pix_txid?: string;
              tracking_code?: string;
              items?: Array<{ product_name: string; quantity: number }>;
            }>}
            onUpdated={() => {
              void refetchOrders();
              void refetchDashboard();
            }}
          />
        </>
      )}

      {tab === "products" && (
        <div className="grid gap-8 lg:grid-cols-2">
          {!hasPix && (
            <div className="lg:col-span-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm">
              Configure PIX em Pagamentos para publicar produtos no marketplace.
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

      {tab === "reviews" && storeId && <StoreReviewsManager storeId={storeId} />}

      {tab === "disputes" && <DisputeEmptyState />}

      {tab === "settings" && storeId && (
        <div className="space-y-6">
          <PixConfigForm storeId={storeId} store={store} onSaved={() => void refetchDashboard()} />
          <PixWebhookStatus storeId={storeId} />
          <StripeConnectPanel storeId={storeId} store={store} loading={dashboardLoading} />
          <ProUpgradePanel
            storeId={storeId}
            plan={String(store?.subscription_plan ?? "free")}
            onSubscribed={() => void refetchDashboard()}
          />
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
