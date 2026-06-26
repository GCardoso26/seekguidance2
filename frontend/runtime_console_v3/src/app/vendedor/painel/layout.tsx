"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/seller-dashboard/Sidebar";
import { useMerchantKycGuard } from "@/hooks/useMerchantKycGuard";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function VendedorPainelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const returnPath = pathname?.startsWith("/vendedor/painel") ? pathname : "/vendedor/painel";
  const { user, loading: authLoading } = useRequireAuth(returnPath);
  const { isLoading: kycLoading, isBlocked } = useMerchantKycGuard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { ownerId, storeSlug, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");

  const guardsPending = authLoading || kycLoading || !user || isBlocked;

  if (guardsPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-luxury-onyx text-luxury-mist">
        <p className="text-sm">
          {authLoading || kycLoading ? "Carregando painel…" : isBlocked ? "Redirecionando…" : "Redirecionando para login…"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-luxury-onyx text-white">
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar sellerId={ownerId} storeSlug={storeSlug} plan={plan} className="fixed left-0 top-0 z-30 h-screen w-64" />
      </div>

      {mobileOpen && (
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

      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            ☰ Menu
          </button>
          <span className="text-sm font-semibold">Painel do Vendedor</span>
        </div>
        {children}
      </div>
    </div>
  );
}
