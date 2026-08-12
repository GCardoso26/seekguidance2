"use client";



import Link from "next/link";

import { useEffect, useState } from "react";

import { MerchantKycCard } from "@/components/kyc/MerchantKycCard";

import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";

import {

  DashboardKpiStrip,

  FulfillmentSlaWidget,

  LowStockWidget,

  OperationalCommandCenter,

  RecentOrdersWidget,

  StickyQuickActionsBar,

  StoreHealthScoreWidget,

  TicketsWidget,

  PostApprovalOnboarding,

  StockSyncWidget,

} from "@/components/seller-dashboard/overview";

import { DashboardWorkspace } from "@/components/seller-dashboard/overview/DashboardWorkspace";

import { WorkspaceSettingsButton } from "@/components/seller-dashboard/overview/WorkspaceSettings";

import { SellerAiAssistantWidget } from "@/components/seller-ai/SellerAiAssistantWidget";
import { OrderDetailDrawer } from "@/components/seller-orders";

import { ReputationOverviewWidget } from "@/components/seller-reputation/ReputationOverviewWidget";

import { useAccountStatus } from "@/hooks/useAccountStatus";

import { useDashboardOverview } from "@/hooks/useDashboardOverview";

import { useOperationalSnapshot } from "@/hooks/useOperationalSnapshot";

import { useSellerWorkspacePreferences } from "@/hooks/useSellerWorkspacePreferences";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

import { useSellerStore } from "@/hooks/useSellerStore";

import { InlineLoading } from "@/components/ui/async-state";

import { needsOnboardingContinue } from "@/lib/kyc-onboarding";

import { useRouter } from "next/navigation";



function greetingForHour(hour: number): string {

  if (hour < 12) return "Bom dia";

  if (hour < 18) return "Boa tarde";

  return "Boa noite";

}



export default function VendedorPainelDashboardPage() {

  const router = useRouter();

  const { user } = useJudgeAuth();

  const { hasStore, isLoading } = useSellerStore();

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(hasStore);

  const { actions, isLoading: opsLoading } = useOperationalSnapshot(hasStore);

  const { data: accountStatus, isLoading: accountLoading } = useAccountStatus();

  const { prefs } = useSellerWorkspacePreferences();

  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

  const [landingChecked, setLandingChecked] = useState(false);



  const kycStatus = accountStatus?.merchant?.kyc_status;

  const kycIncomplete = Boolean(

    kycStatus &&

      kycStatus !== "verified" &&

      needsOnboardingContinue(kycStatus, accountStatus?.merchant?.rejection_reason),

  );



  useEffect(() => {

    if (landingChecked || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (params.has("onboarding")) {

      setLandingChecked(true);

      return;

    }

    if (prefs.defaultLanding === "/vendedor/painel/operacao") {

      router.replace("/vendedor/painel/operacao");

    }

    setLandingChecked(true);

  }, [prefs.defaultLanding, router, landingChecked]);



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

        <div className="mt-6 surface-card p-8 text-center">

          <p className="text-muted-foreground">Você ainda não tem uma loja cadastrada.</p>

          <Link href="/vender" className="mt-4 inline-block text-primary underline">

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

        subtitle="O que precisa da sua atenção agora"

        action={<WorkspaceSettingsButton />}

      />

      <main className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">

        {kycIncomplete && (

          <div id="kyc-status">

            <MerchantKycCard />

          </div>

        )}

        <PostApprovalOnboarding

          visible={Boolean(

            (overview as { post_approval_onboarding?: { visible?: boolean } } | undefined)

              ?.post_approval_onboarding?.visible,

          )}

          steps={

            (overview as { post_approval_onboarding?: { steps?: Array<{ id: string; label: string; done: boolean; href: string }> } } | undefined)

              ?.post_approval_onboarding?.steps

          }

        />



        <DashboardWorkspace

          widgets={{

            command_center: (

              <OperationalCommandCenter actions={actions} isLoading={opsLoading} />

            ),

            seller_ai: <SellerAiAssistantWidget />,

            kpi_strip: <DashboardKpiStrip />,

            health: (

              <StoreHealthScoreWidget

                kycStatus={kycStatus}

                sla={overview?.fulfillment_sla}

                lowStockCount={overview?.low_stock?.length ?? 0}

                openTickets={overview?.open_tickets ?? 0}

                isLoading={overviewLoading || accountLoading}

              />

            ),

            reputation: <ReputationOverviewWidget reputation={overview?.reputation} />,

            sla: <FulfillmentSlaWidget sla={overview?.fulfillment_sla} />,

            orders_stock: (

              <div className="grid gap-6 lg:grid-cols-2">

                <RecentOrdersWidget

                  orders={overview?.recent_orders ?? []}

                  onSelectOrder={setDrawerOrderId}

                />

                <div className="space-y-6">

                  <StockSyncWidget

                    lastSyncAt={

                      (overview as { stock_sync?: { last_sync_at?: string | null } } | undefined)

                        ?.stock_sync?.last_sync_at

                    }

                    activeListings={

                      (overview as { stock_sync?: { active_listings?: number } } | undefined)

                        ?.stock_sync?.active_listings ?? 0

                    }

                    lowStockCount={

                      (overview as { stock_sync?: { low_stock_count?: number } } | undefined)

                        ?.stock_sync?.low_stock_count ?? overview?.low_stock?.length ?? 0

                    }

                    importHref={

                      (overview as { stock_sync?: { import_href?: string } } | undefined)

                        ?.stock_sync?.import_href ?? "/vendedor/painel/estoque"

                    }

                  />

                  <LowStockWidget items={overview?.low_stock ?? []} />

                  <TicketsWidget count={overview?.open_tickets ?? 0} />

                </div>

              </div>

            ),

            quick_actions: <StickyQuickActionsBar sticky />,

          }}

        />

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


