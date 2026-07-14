"use client";

import "@/styles/seller-panel.css";
import { SellerPanelThemeProvider, useSellerPanelTheme } from "@/contexts/SellerPanelThemeContext";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelShell } from "@/components/layout/PanelShell";
import { Sidebar } from "@/components/seller-dashboard/Sidebar";
import { SellerPanelTopBar } from "@/components/seller-dashboard/SellerPanelTopBar";
import { SellerPanelProvider } from "@/contexts/SellerPanelContext";
import { useMerchantKycGuard } from "@/hooks/useMerchantKycGuard";
import { useMerchantOnboardingSync } from "@/hooks/useMerchantOnboardingSync";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSellerStore } from "@/hooks/useSellerStore";
import { InlineLoading } from "@/components/ui/async-state";
import { isMerchantOnboardingReturn } from "@/lib/merchant-onboarding-return";

function VendedorPainelLayoutInner({ children }: { children: React.ReactNode }) {
  const { theme } = useSellerPanelTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onboardingMode = searchParams.get("onboarding");
  const onboardingReturn = isMerchantOnboardingReturn(onboardingMode);
  const returnPath = pathname?.startsWith("/vendedor/painel") ? pathname : "/vendedor/painel";
  const { user, loading: authLoading } = useRequireAuth(returnPath);
  const { isLoading: kycLoading, isBlocked } = useMerchantKycGuard(!onboardingReturn);
  const { syncing: onboardingSyncing } = useMerchantOnboardingSync();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { ownerId, storeSlug, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");

  const kycGateActive = isBlocked && !onboardingReturn;
  const guardsPending = authLoading || kycLoading || !user || kycGateActive || onboardingSyncing;
  const isPdvRoute = pathname?.includes("/vendedor/painel/pdv");

  if (guardsPending) {
    const guardMessage = onboardingSyncing
      ? "Atualizando status do cadastro Stripe…"
      : authLoading || kycLoading
        ? "Carregando painel…"
        : kycGateActive
          ? "Redirecionando…"
          : "Redirecionando para login…";

    return (
      <main className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
        <InlineLoading message={guardMessage} />
      </main>
    );
  }

  return (
    <PanelShell
      variant="seller"
      theme={theme}
      hideSidebar={isPdvRoute}
      mobileOpen={mobileOpen}
      onCloseMobile={() => setMobileOpen(false)}
      sidebar={
        <Sidebar
          sellerId={ownerId}
          storeSlug={storeSlug}
          plan={plan}
          className="h-full"
          onNavigate={() => setMobileOpen(false)}
        />
      }
      topBar={
        !isPdvRoute ? (
          <SellerPanelTopBar
            title={isPdvRoute ? "PDV — Balcão" : "Painel do Vendedor"}
            showMenuButton
            onMenuClick={() => setMobileOpen(true)}
          />
        ) : undefined
      }
    >
      <SellerPanelProvider plan={plan}>{children}</SellerPanelProvider>
    </PanelShell>
  );
}

export default function VendedorPainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerPanelThemeProvider>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
            <InlineLoading message="Carregando painel…" />
          </main>
        }
      >
        <VendedorPainelLayoutInner>{children}</VendedorPainelLayoutInner>
      </Suspense>
    </SellerPanelThemeProvider>
  );
}
