"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell, PageSkeleton } from "@/components/seller-dashboard/PageShell";
import { SellerCreateListingForm } from "@/components/seller-dashboard/SellerCreateListingForm";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import type { UnifiedCard } from "@/types/card";

function NovaListagemContent() {
  const searchParams = useSearchParams();
  const cardId = searchParams.get("cardId");

  const { data: card, isLoading, error } = useQuery({
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
    <PageShell>
      {!cardId && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-luxury-mist">
            Para criar uma listagem, abra uma carta no catálogo e use &quot;Listar para venda&quot;, ou
            acesse com <code className="text-xs">?cardId=UUID</code> na URL.
          </p>
          <Button asChild className="mt-4 bg-luxury-gold text-luxury-onyx">
            <Link href="/loja/busca">Buscar cartas</Link>
          </Button>
        </div>
      )}
      {cardId && isLoading && <PageSkeleton rows={4} />}
      {cardId && error && (
        <p className="text-red-300">Carta não encontrada.</p>
      )}
      {card && <SellerCreateListingForm card={card} />}
    </PageShell>
  );
}

export default function NovaListagemPage() {
  return (
    <>
      <SellerHeader action={null} />
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <NovaListagemContent />
      </Suspense>
    </>
  );
}
