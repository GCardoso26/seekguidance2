"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { DashboardStats } from "@/components/seller-dashboard/DashboardStats";
import { RecentSalesTable } from "@/components/seller-dashboard/RecentSalesTable";
import { PendingActions } from "@/components/seller-dashboard/PendingActions";
import { MerchantKycCard } from "@/components/kyc/MerchantKycCard";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useAccountStatus } from "@/hooks/useAccountStatus";

const SalesChart = dynamic(
  () => import("@/components/dashboard/SalesChart").then((m) => m.SalesChart),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" />, ssr: false },
);

export default function VendedorPainelDashboardPage() {
  const { hasStore, isLoading, dashboard, dashboardLoading } = useSellerStore();
  const { data: accountStatus } = useAccountStatus();
  const store = dashboard?.store as Record<string, unknown> | undefined;
  const kycStatus = accountStatus?.merchant?.kyc_status;
  const kycIncomplete = Boolean(kycStatus && kycStatus !== "verified");

  if (isLoading || dashboardLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-luxury-mist">Carregando painel…</p>
      </main>
    );
  }

  if (!hasStore) {
    return (
      <main className="flex flex-1 flex-col p-6">
        <SellerHeader />
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-luxury-mist">Você ainda não tem uma loja cadastrada.</p>
          <Link href="/stores/create" className="mt-4 inline-block text-luxury-gold underline">
            Cadastrar loja
          </Link>
        </div>
      </main>
    );
  }

  const chartData = (dashboard?.sales_chart ?? []).map(
    (row: { day?: string; date?: string; revenue_cents?: number }) => ({
      day: String(row.day ?? row.date ?? ""),
      revenue_cents: Number(row.revenue_cents ?? 0),
    }),
  );

  return (
    <>
      <SellerHeader displayName={String(store?.name ?? "")} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div id="kyc-status">
          <MerchantKycCard />
        </div>
        <DashboardStats kpis={dashboard?.kpis} revenue={dashboard?.revenue} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">
              Vendas (30 dias)
            </h2>
            <SalesChart data={chartData} />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-mist">
              Ações pendentes
            </h2>
            <PendingActions
              shipments={dashboard?.pending?.shipments}
              disputes={dashboard?.pending?.disputes}
              lowStock={dashboard?.pending?.low_stock}
              kycIncomplete={kycIncomplete}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-lg font-semibold">Vendas recentes</h2>
          <RecentSalesTable orders={dashboard?.recent_orders ?? []} />
        </div>
      </main>
    </>
  );
}
