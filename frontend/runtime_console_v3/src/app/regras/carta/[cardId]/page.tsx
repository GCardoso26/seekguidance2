"use client";

import Link from "next/link";
import { use } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardRulesTab } from "@/components/cards/CardRulesTab";
import { useCardDetail } from "@/hooks/useCardDetail";
import { Button } from "@/components/ui/button";

export default function RegrasCartaPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const { data, isLoading } = useCardDetail(cardId);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href={`/loja/cartas/${cardId}`} className="text-sm text-muted-foreground">
          ← Voltar à carta
        </Link>
        {isLoading && <p className="mt-6 text-muted-foreground">Carregando…</p>}
        {data?.card && (
          <>
            <h1 className="mt-4 text-2xl font-bold">{data.card.name}</h1>
            <p className="text-sm text-muted-foreground">Regras e legalidades</p>
            <div className="mt-6">
              <CardRulesTab card={data.card} cardId={cardId} />
            </div>
            <Button className="mt-8" asChild>
              <Link href="/judge">Perguntar ao juiz sobre esta carta</Link>
            </Button>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
