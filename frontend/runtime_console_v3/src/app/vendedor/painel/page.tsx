"use client";

import Link from "next/link";
import { useState } from "react";
import { MerchantKycCard } from "@/components/kyc/MerchantKycCard";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  FulfillmentSlaWidget,
  LowStockWidget,
  MetricCardsRow,
  QuickActionsBar,
  RecentOrdersWidget,
  TicketsWidget,
} from "@/components/seller-dashboard/overview";
import { OrderDetailDrawer } from "@/components/seller-orders";
import { ReputationOverviewWidget } from "@/components/seller-reputation/ReputationOverviewWidget";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useSellerStore } from "@/hooks/useSellerStore";
import { InlineLoading } from "@/components/ui/async-state";
import { needsOnboardingContinue } from "@/lib/kyc-onboarding";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function VendedorPainelDashboardPage() {
  const { user } = useJudgeAuth();
  const { hasStore, isLoading } = useSellerStore();
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(hasStore);
  const { data: accountStatus } = useAccountStatus();
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

  const kycStatus = accountStatus?.merchant?.kyc_status;
  const kycIncomplete = Boolean(
    kycStatus &&
      kycStatus !== "verified" &&
      needsOnboardingContinue(kycStatus, accountStatus?.merchant?.rejection_reason),
  );

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Vendedor";
  const greeting = `${greetingForHour(new Date().getHours())}, ${displayName}`;

  if (isLoading || overviewLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <InlineLoading message="Carregando painel…" />
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

  return (
    <>
      <SellerHeader
        displayName={greeting}
        subtitle="Visão operacional da sua loja"
        action={null}
      />
      <main className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
        {kycIncomplete && (
          <div id="kyc-status">
            <MerchantKycCard />
          </div>
        )}

        <MetricCardsRow metrics={overview?.metrics} />

        <ReputationOverviewWidget reputation={overview?.reputation} />

        <FulfillmentSlaWidget sla={overview?.fulfillment_sla} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentOrdersWidget
            orders={overview?.recent_orders ?? []}
            onSelectOrder={setDrawerOrderId}
          />
          <div className="space-y-6">
            <LowStockWidget items={overview?.low_stock ?? []} />
            <TicketsWidget count={overview?.open_tickets ?? 0} />
          </div>
        </div>

        <QuickActionsBar />
      </main>

      <OrderDetailDrawer
        orderId={drawerOrderId}
        open={Boolean(drawerOrderId)}
        onOpenChange={(open) => {
          if (!open) setDrawerOrderId(null);
        }}
      />
    </>
  );
}
