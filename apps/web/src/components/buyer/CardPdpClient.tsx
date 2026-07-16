"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CatalogBlock } from "@/src/components/buyer/CatalogBlock";
import { OffersBlock } from "@/src/components/buyer/OffersBlock";
import { useCard, useCardOffers } from "@/src/hooks";
import { Analytics } from "@/src/analytics/events";
import { ErrorState, Loading } from "@/src/components/ui";

export function CardPdpClient({ cardId }: { cardId: string }) {
  const cardQuery = useCard(cardId);
  const offersQuery = useCardOffers(cardId);

  useEffect(() => {
    if (cardQuery.isSuccess) {
      Analytics.track("buyer_card_open", { cardId });
    }
  }, [cardQuery.isSuccess, cardId]);

  if (cardQuery.isPending) {
    return <Loading label="Carregando carta…" />;
  }

  if (cardQuery.isError || !cardQuery.data) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="Não foi possível carregar esta carta."
          description="Verifique o link ou volte à busca."
        />
        <Link href="/search" className="text-sm text-emerald-800 underline">
          Voltar à busca
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/search" className="text-sm text-emerald-800 underline">
        ← Busca
      </Link>

      <CatalogBlock card={cardQuery.data} />

      <OffersBlock
        cardId={cardId}
        cardName={cardQuery.data.name}
        status={
          offersQuery.isPending
            ? "pending"
            : offersQuery.isError
              ? "error"
              : "success"
        }
        data={offersQuery.data}
      />
    </div>
  );
}
