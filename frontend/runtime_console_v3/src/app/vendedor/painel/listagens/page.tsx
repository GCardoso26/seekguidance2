"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { ListingManager } from "@/components/seller-dashboard/ListingManager";
import { Button } from "@/components/ui/button";
import type { CardListing } from "@/types/card";

export default function VendedorListagensPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["seller-listings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/listings");
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ listings: CardListing[] }>;
    },
  });

  if (error instanceof Error && error.message === "login_required") {
    return (
      <main className="p-6 text-center">
        <p className="text-luxury-mist">Faça login para gerenciar listagens.</p>
        <Button asChild className="mt-4">
          <Link href="/login?next=/vendedor/painel/listagens">Entrar</Link>
        </Button>
      </main>
    );
  }

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
          <p className="text-sm text-luxury-mist">Cartas do catálogo que você listou para venda.</p>
        </div>
        <ListingManager listings={data?.listings ?? []} isLoading={isLoading} />
      </main>
    </>
  );
}
