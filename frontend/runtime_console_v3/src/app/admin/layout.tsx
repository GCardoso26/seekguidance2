"use client";

import "@/styles/seller-panel.css";
import Link from "next/link";
import { Suspense, useState } from "react";
import { PanelShell } from "@/components/layout/PanelShell";
import { AdminPanelTopBar } from "@/components/admin/AdminPanelTopBar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { InlineLoading } from "@/components/ui/async-state";
import { useUserRole } from "@/hooks/useUserRole";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <InlineLoading message="Carregando administração…" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-destructive">Acesso restrito a administradores.</p>
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <PanelShell
      variant="admin"
      mobileOpen={mobileOpen}
      onCloseMobile={() => setMobileOpen(false)}
      sidebar={<AdminSidebar className="h-full" onNavigate={() => setMobileOpen(false)} />}
      topBar={<AdminPanelTopBar showMenuButton onMenuClick={() => setMobileOpen(true)} />}
    >
      {children}
    </PanelShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <InlineLoading message="Carregando administração…" />
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
