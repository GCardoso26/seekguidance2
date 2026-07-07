"use client";

import "@/styles/seller-panel.css";
import Link from "next/link";
import { Suspense, useState } from "react";
import { AdminPanelTopBar } from "@/components/admin/AdminPanelTopBar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { InlineLoading } from "@/components/ui/async-state";
import { useUserRole } from "@/hooks/useUserRole";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-luxury-onyx">
        <InlineLoading message="Carregando administração…" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-luxury-onyx px-6 text-center text-white">
        <p className="text-red-400">Acesso restrito a administradores.</p>
        <Link href="/" className="text-sm text-luxury-mist hover:text-luxury-gold">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-panel flex min-h-screen bg-luxury-panel-bg text-white">
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <AdminSidebar className="fixed left-0 top-0 z-30 h-screen w-64" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <AdminSidebar
            className="relative z-50 h-full w-64"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        <AdminPanelTopBar showMenuButton onMenuClick={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-luxury-onyx">
          <InlineLoading message="Carregando administração…" />
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
