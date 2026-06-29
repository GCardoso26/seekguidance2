"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Sidebar } from "@/components/seller-dashboard/Sidebar";
import { SellerPanelProvider } from "@/contexts/SellerPanelContext";
import { useMerchantKycGuard } from "@/hooks/useMerchantKycGuard";
import { useMerchantOnboardingSync } from "@/hooks/useMerchantOnboardingSync";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSellerStore } from "@/hooks/useSellerStore";
import { isMerchantOnboardingReturn } from "@/lib/merchant-onboarding-return";

function VendedorPainelLayoutInner({ children }: { children: React.ReactNode }) {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-luxury-onyx text-luxury-mist">
        <p className="text-sm">
          {onboardingSyncing
            ? "Atualizando status do cadastro Stripe…"
            : authLoading || kycLoading
              ? "Carregando painel…"
              : kycGateActive
                ? "Redirecionando…"
                : "Redirecionando para login…"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-luxury-onyx text-white">
      {!isPdvRoute && (
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <Sidebar sellerId={ownerId} storeSlug={storeSlug} plan={plan} className="fixed left-0 top-0 z-30 h-screen w-64" />
        </div>
      )}

      {mobileOpen && !isPdvRoute && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            sellerId={ownerId}
            storeSlug={storeSlug}
            plan={plan}
            className="relative z-50 h-full w-64"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className={`flex min-h-screen flex-1 flex-col ${isPdvRoute ? "" : "lg:ml-64"}`}>
        <div className={`flex items-center gap-3 border-b border-white/10 px-4 py-3 ${isPdvRoute ? "lg:flex" : "lg:hidden"}`}>
          {!isPdvRoute && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm lg:hidden"
            >
              ☰ Menu
            </button>
          )}
          <span className="text-sm font-semibold">{isPdvRoute ? "PDV — Balcão" : "Painel do Vendedor"}</span>
          {isPdvRoute && (
            <Link href="/vendedor/painel" className="ml-auto text-xs text-luxury-gold underline lg:hidden">
              Painel
            </Link>
          )}
        </div>
        <SellerPanelProvider plan={plan}>{children}</SellerPanelProvider>
      </div>
    </div>
  );
}

export default function VendedorPainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-luxury-onyx text-luxury-mist">
          <p className="text-sm">Carregando painel…</p>
        </div>
      }
    >
      <VendedorPainelLayoutInner>{children}</VendedorPainelLayoutInner>
    </Suspense>
  );
}
