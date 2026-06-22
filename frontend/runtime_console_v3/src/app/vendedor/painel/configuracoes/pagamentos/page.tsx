"use client";

import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PixConfigForm } from "@/components/store/PixConfigForm";
import { PixWebhookStatus } from "@/components/store/PixWebhookStatus";
import { StripeConnectPanel } from "@/components/store/StripeConnectPanel";
import { ProUpgradePanel } from "@/components/store/ProUpgradePanel";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function PagamentosConfigPage() {
  const { storeId, dashboard, dashboardLoading, refetchDashboard } = useSellerStore();
  const store = dashboard?.store as Record<string, unknown> | undefined;

  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <h2 className="text-xl font-bold">Pagamentos</h2>
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
