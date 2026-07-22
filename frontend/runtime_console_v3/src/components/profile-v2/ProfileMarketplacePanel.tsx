"use client";

import Link from "next/link";
import { Eye, PauseCircle, ShoppingBag, Store } from "lucide-react";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

/** Consome links para Marketplace API / painel vendedor — sem novo BC. */
export function ProfileMarketplacePanel() {
  const { user } = useJudgeAuth();

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Entre para ver seu marketplace.</p>
        <Link href="/entrar?next=/perfil/marketplace" className="mt-3 inline-block text-primary hover:underline">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="profile-marketplace-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Marketplace</h1>
        <p className="text-small text-muted-foreground">
          Métricas detalhadas no painel do vendedor (APIs públicas do Marketplace).
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileSummaryCard
          label="Produtos publicados"
          value="Abrir"
          href="/vendedor/painel"
          icon={Store}
          hint="Marketplace API"
        />
        <ProfileSummaryCard
          label="Visualizações / Cliques"
          value="Analytics"
          href="/vendedor/painel"
          icon={Eye}
        />
        <ProfileSummaryCard
          label="Pedidos / Receita"
          value="Vendas"
          href="/perfil/vendas"
          icon={ShoppingBag}
        />
        <ProfileSummaryCard
          label="Pausados / Vendidos"
          value="Gerenciar"
          href="/vendedor/painel"
          icon={PauseCircle}
        />
      </div>
      <p className="text-small text-muted-foreground">
        Duplicatas prontas para anunciar:{" "}
        <Link href="/colecao/duplicatas" className="text-primary hover:underline">
          ver duplicatas na coleção
        </Link>
        .
      </p>
    </div>
  );
}
