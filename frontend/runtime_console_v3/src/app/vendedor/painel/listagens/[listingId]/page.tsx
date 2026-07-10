"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardListing } from "@/types/card";

export default function EditarListagemPage() {
  const params = useParams<{ listingId: string }>();
  const listingId = params.listingId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["seller-listing", listingId],
    queryFn: async () => {
      const res = await fetch("/api/seller/listings");
      if (!res.ok) throw new Error("fetch_failed");
      const payload = (await res.json()) as { listings: CardListing[] };
      const found = payload.listings.find((l) => l.id === listingId);
      if (!found) throw new Error("not_found");
      return found;
    },
  });

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch(`/api/seller/listings/${encodeURIComponent(listingId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: Number(form.get("price")),
        quantity: Number(form.get("quantity")),
      }),
    });
    await refetch();
  }

  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <Link href="/vendedor/painel/listagens" className="text-sm text-muted-foreground hover:underline">
          ← Listagens
        </Link>
        {isLoading && <p className="text-muted-foreground">Carregando…</p>}
        {data && (
          <form onSubmit={(e) => void save(e)} className="max-w-md space-y-4 surface-card p-6">
            <h2 className="text-lg font-semibold">{data.cardName ?? "Editar listagem"}</h2>
            <label className="block text-sm">
              Preço (R$)
              <Input name="price" type="number" step="0.01" defaultValue={data.price} className="mt-1" />
            </label>
            <label className="block text-sm">
              Quantidade
              <Input name="quantity" type="number" min={1} defaultValue={data.quantity} className="mt-1" />
            </label>
            <Button type="submit">Salvar</Button>
          </form>
        )}
      </main>
    </>
  );
}
