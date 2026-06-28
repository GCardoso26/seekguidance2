"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListingManager } from "@/components/seller-dashboard/ListingManager";
import {
  NovaListagemAction,
  NovaListagemButton,
} from "@/components/seller-dashboard/ListingsPagination";
import { PageError, PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerPanel } from "@/contexts/SellerPanelContext";
import { buildSellerListingsQuery } from "@/lib/seller-listings-query";
import { canCreateListing, planHasFeature } from "@/lib/seller-plans";
import type { SellerListingRow } from "@/types/seller-listing";

const PAGE_SIZE = 24;

type ListingsResponse = {
  listings: SellerListingRow[];
  total: number;
  page: number;
  limit: number;
};

function NovaListagemHeaderAction({ plan, total }: { plan: string; total: number }) {
  if (!planHasFeature(plan, "listings")) {
    return <NovaListagemAction href="/vendedor/painel/planos" label="Ver planos" />;
  }
  if (!canCreateListing(plan, total)) {
    return (
      <NovaListagemAction
        href="/vendedor/painel/planos"
        label="Limite atingido — fazer upgrade"
      />
    );
  }
  return <NovaListagemButton />;
}

export default function VendedorListagensPage() {
  const [page, setPage] = useState(1);
  const { plan } = useSellerPanel();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["seller-listings", page],
    queryFn: async () => {
      const res = await fetch(`/api/seller/listings?${buildSellerListingsQuery(page, PAGE_SIZE)}`);
      if (res.status === 401) throw new Error("login_required");
      if (res.status === 403) throw new Error("plan_forbidden");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<ListingsResponse>;
    },
  });

  if (error instanceof Error && error.message === "login_required") {
    return (
      <main className="p-6 text-center">
        <p className="text-luxury-mist">Faça login para gerenciar listagens.</p>
        <Button asChild className="mt-4 bg-luxury-gold text-luxury-onyx">
          <Link href="/entrar?next=/vendedor/painel/listagens">Entrar</Link>
        </Button>
      </main>
    );
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <SellerHeader action={<NovaListagemHeaderAction plan={plan} total={total} />} />
      <PageShell>
        <PageHeader
          title="Minhas listagens"
          description="Cartas do catálogo que você listou para venda."
          meta={
            total > 0 ? (
              <p className="mt-1 text-xs text-luxury-mist/80">
                {total} {total === 1 ? "item" : "itens"}
                {totalPages > 1 && !isLoading ? ` · página ${page} de ${totalPages}` : null}
              </p>
            ) : null
          }
        />

        {error instanceof Error && error.message !== "login_required" ? (
          <PageError
            message={
              error.message === "plan_forbidden"
                ? "Seu plano não permite esta ação. Veja opções em Planos."
                : "Não foi possível carregar suas listagens."
            }
            onRetry={() => void refetch()}
          />
        ) : (
          <ListingManager
            listings={data?.listings ?? []}
            isLoading={isLoading}
            page={page}
            total={total}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </PageShell>
    </>
  );
}
