"use client";

import "@/styles/seller-panel.css";
import { SellerPanelThemeProvider, useSellerPanelTheme } from "@/contexts/SellerPanelThemeContext";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelShell } from "@/components/layout/PanelShell";
import { Sidebar } from "@/components/seller-dashboard/Sidebar";
import { SellerPanelTopBar } from "@/components/seller-dashboard/SellerPanelTopBar";
import { SellerPanelProvider } from "@/contexts/SellerPanelContext";
import { useMerchantKycGuard } from "@/hooks/useMerchantKycGuard";
import { useMerchantOnboardingSync } from "@/hooks/useMerchantOnboardingSync";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSellerStore } from "@/hooks/useSellerStore";
import { InlineAlert, InlineLoading } from "@/components/ui/async-state";
import { isMerchantOnboardingReturn } from "@/lib/merchant-onboarding-return";
import { useAccountStatus } from "@/hooks/useAccountStatus";

const GUARD_TIMEOUT_MS = 12_000;

function VendedorPainelLayoutInner({ children }: { children: React.ReactNode }) {
  const { theme } = useSellerPanelTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onboardingMode = searchParams.get("onboarding");
  const onboardingReturn = isMerchantOnboardingReturn(onboardingMode);
  const returnPath = pathname?.startsWith("/vendedor/painel") ? pathname : "/vendedor/painel";
  const { user, loading: authLoading } = useRequireAuth(returnPath);
  const { isLoading: kycLoading, isBlocked, isError: kycError, refetch: refetchKyc } =
    useMerchantKycGuard(!onboardingReturn);
  const { isFetching: statusFetching } = useAccountStatus();
  const { syncing: onboardingSyncing } = useMerchantOnboardingSync();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guardsTimedOut, setGuardsTimedOut] = useState(false);
  const { ownerId, storeSlug, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");

  useEffect(() => {
    const id = window.setTimeout(() => setGuardsTimedOut(true), GUARD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);

  const kycGateActive = isBlocked && !onboardingReturn;
  // Fail-open after timeout / KYC error so the shell never hangs forever.
  const kycBlocking = kycLoading && !kycError && !guardsTimedOut;
  const authBlocking = authLoading && !guardsTimedOut;
  const guardsPending =
    authBlocking || kycBlocking || (!user && !guardsTimedOut) || kycGateActive || onboardingSyncing;
  const isPdvRoute = pathname?.includes("/vendedor/painel/pdv");

  if (guardsPending) {
    const guardMessage = onboardingSyncing
      ? "Atualizando status do cadastro Stripe…"
      : authBlocking || kycBlocking
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

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
        <InlineLoading message="Redirecionando para login…" />
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
      <SellerPanelProvider plan={plan}>
        {kycError ? (
          <div className="border-b border-border px-4 py-2">
            <InlineAlert
              message={
                statusFetching
                  ? "Verificando status da conta…"
                  : "Status da conta indisponível no momento. O painel permanece disponível."
              }
              onRetry={!statusFetching ? () => void refetchKyc() : undefined}
            />
          </div>
        ) : null}
        {children}
      </SellerPanelProvider>
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
