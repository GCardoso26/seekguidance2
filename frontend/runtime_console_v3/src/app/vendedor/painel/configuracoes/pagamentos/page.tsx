"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PixConfigForm } from "@/components/store/PixConfigForm";
import { PixWebhookStatus } from "@/components/store/PixWebhookStatus";
import { StripeConnectPanel } from "@/components/store/StripeConnectPanel";
import { ProUpgradePanel } from "@/components/store/ProUpgradePanel";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function PagamentosConfigPage() {
  const search = useSearchParams();
  const { storeId, dashboard, dashboardLoading, refetchDashboard } = useSellerStore();
  const store = dashboard?.store as Record<string, unknown> | undefined;

  useEffect(() => {
    const flag = search.get("onboarding");
    if (!storeId || (flag !== "success" && flag !== "refresh")) return;
    void (async () => {
      await fetch(`/api/marketplace/shop/connect/refresh/${encodeURIComponent(storeId)}`, {
        method: "POST",
      });
      await refetchDashboard();
    })();
  }, [search, storeId, refetchDashboard]);

  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <h2 className="text-xl font-bold">Pagamentos</h2>
        {search.get("onboarding") === "success" && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200">
            Onboarding Stripe concluído — sincronizando status da conta…
          </p>
        )}
        {storeId && (
          <>
            <PixConfigForm storeId={storeId} store={store} onSaved={() => void refetchDashboard()} />
            <PixWebhookStatus storeId={storeId} />
            <StripeConnectPanel storeId={storeId} store={store} loading={dashboardLoading} />
            <ProUpgradePanel
              storeId={storeId}
              plan={String(store?.subscription_plan ?? "free")}
              onSubscribed={() => void refetchDashboard()}
            />
          </>
        )}
      </main>
    </>
  );
}
