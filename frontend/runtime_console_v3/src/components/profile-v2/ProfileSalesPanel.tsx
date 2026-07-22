"use client";

import Link from "next/link";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

/** Vendas — ponte para Marketplace seller (APIs públicas). */
export function ProfileSalesPanel() {
  const { data, isLoading } = useBuyerDashboard();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6" data-testid="profile-sales-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Vendas</h1>
        <p className="text-small text-muted-foreground">
          Pedidos e receita no painel do vendedor (Marketplace API).
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ProfileSummaryCard
          label="Painel de vendas"
          value="Abrir"
          href="/vendedor/painel"
          hint="Listagens, pedidos, receita"
        />
        <ProfileSummaryCard
          label="Economia como comprador"
          value={
            data
              ? formatCurrency((data.savings_cents ?? 0) / 100, "BRL")
              : "—"
          }
          href="/perfil/compras"
        />
        <ProfileSummaryCard
          label="Anunciar duplicatas"
          value="Coleção"
          href="/colecao/duplicatas"
        />
      </div>
      <p className="text-small text-muted-foreground">
        Ainda não vendedor?{" "}
        <Link href="/vendedor" className="text-primary hover:underline">
          Começar a vender
        </Link>
      </p>
    </div>
  );
}
