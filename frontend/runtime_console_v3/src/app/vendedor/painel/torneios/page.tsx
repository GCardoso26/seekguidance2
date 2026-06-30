"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TournamentCreateModal } from "@/components/seller-dashboard/tournaments/TournamentCreateModal";
import { TournamentManager } from "@/components/seller-dashboard/tournaments/TournamentManager";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerTournaments } from "@/hooks/useSellerTournaments";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

export default function TorneiosPage() {
  const { hasStore, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const canAccess = planHasFeature(plan, "tournaments");
  const { data, isLoading, refetch } = useSellerTournaments({
    page,
    limit: 20,
    enabled: hasStore && canAccess,
  });

  function onUpdated() {
    void qc.invalidateQueries({ queryKey: ["seller-tournaments"] });
    void refetch();
  }

  if (!hasStore) {
    return (
      <main className="p-8 text-center text-luxury-mist">
        <Link href="/stores/create" className="text-luxury-gold underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main className="p-8 text-center">
        <p className="text-luxury-mist">Torneios disponíveis no plano Lojista.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  return (
    <>
      <SellerHeader
        action={
          <Button data-testid="tournament-new-btn" onClick={() => setCreateOpen(true)}>
            Novo torneio
          </Button>
        }
      />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h1 className="text-xl font-bold">Torneios</h1>
          <p className="text-sm text-luxury-mist">Organize eventos, inscrições e chaves na sua loja.</p>
        </div>

        <TournamentManager
          tournaments={data?.tournaments ?? []}
          isLoading={isLoading}
          page={page}
          total={data?.total ?? 0}
          limit={20}
          onPageChange={setPage}
        />
      </main>

      <TournamentCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onUpdated}
      />
    </>
  );
}
