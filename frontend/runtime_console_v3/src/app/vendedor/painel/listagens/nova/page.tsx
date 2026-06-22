"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { CreateListingForm } from "@/components/seller/CreateListingForm";
import { Button } from "@/components/ui/button";
import type { UnifiedCard } from "@/types/card";

function NovaListagemContent() {
  const searchParams = useSearchParams();
  const cardId = searchParams.get("cardId");

  const { data: card, isLoading } = useQuery({
    queryKey: ["listing-card", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/games/mtg/cards/${encodeURIComponent(cardId!)}`);
      if (!res.ok) throw new Error("card_not_found");
      const payload = await res.json();
      return (payload.card ?? payload) as UnifiedCard;
    },
    enabled: Boolean(cardId),
  });

  return (
    <main className="flex-1 space-y-4 overflow-y-auto p-6">
      <Link href="/vendedor/painel/listagens" className="text-sm text-luxury-mist hover:underline">
        ← Voltar às listagens
      </Link>
      {!cardId && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-luxury-mist">
            Para criar uma listagem, abra uma carta no catálogo e use &quot;Listar para venda&quot;, ou
            acesse com <code className="text-xs">?cardId=UUID</code> na URL.
          </p>
          <Button asChild className="mt-4">
            <Link href="/loja/busca">Buscar cartas</Link>
          </Button>
        </div>
      )}
      {cardId && isLoading && <p className="text-luxury-mist">Carregando carta…</p>}
      {card && <CreateListingForm card={card} />}
    </main>
  );
}

export default function NovaListagemPage() {
  return (
    <>
      <SellerHeader action={null} />
      <Suspense fallback={<p className="p-6 text-luxury-mist">Carregando…</p>}>
        <NovaListagemContent />
      </Suspense>
    </>
  );
}
