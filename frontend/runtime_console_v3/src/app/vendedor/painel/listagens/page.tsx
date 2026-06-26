"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { ListingManager } from "@/components/seller-dashboard/ListingManager";
import { Button } from "@/components/ui/button";
import { buildSellerListingsQuery } from "@/lib/seller-listings-query";
import type { CardListing } from "@/types/card";

const PAGE_SIZE = 24;

type ListingsResponse = {
  listings: CardListing[];
  total: number;
  page: number;
  limit: number;
};

export default function VendedorListagensPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["seller-listings", page],
    queryFn: async () => {
      const res = await fetch(`/api/seller/listings?${buildSellerListingsQuery(page, PAGE_SIZE)}`);
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<ListingsResponse>;
    },
  });

  if (error instanceof Error && error.message === "login_required") {
    return (
      <main className="p-6 text-center">
        <p className="text-luxury-mist">Faça login para gerenciar listagens.</p>
        <Button asChild className="mt-4">
          <Link href="/entrar?next=/vendedor/painel/listagens">Entrar</Link>
        </Button>
      </main>
    );
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <SellerHeader
        action={
          <Button asChild>
            <Link href="/vendedor/painel/listagens/nova">+ Nova listagem</Link>
          </Button>
        }
      />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <div>
          <h2 className="text-xl font-bold">Minhas listagens</h2>
          <p className="text-sm text-luxury-mist">
            Cartas do catálogo que você listou para venda.
            {total > 0 && (
              <span className="ml-2 text-luxury-mist/80">
                ({total} {total === 1 ? "item" : "itens"})
              </span>
            )}
          </p>
        </div>
        <ListingManager
          listings={data?.listings ?? []}
          isLoading={isLoading}
          page={page}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
        {totalPages > 1 && !isLoading && (
          <p className="text-center text-xs text-luxury-mist" data-testid="seller-listings-page-indicator">
            Página {page} de {totalPages}
          </p>
        )}
      </main>
    </>
  );
}
