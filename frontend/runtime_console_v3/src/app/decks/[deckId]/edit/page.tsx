"use client";

import { use } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { DeckBuilder } from "@/components/deckbuilder/DeckBuilder";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function DeckEditPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { user, loading } = useRequireAuth(`/decks/${deckId}/edit`);

  if (loading || !user) {
    return (
      <MobileLayout>
        <div className="p-8 text-sm text-muted-foreground">Carregando…</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <DeckBuilder deckId={deckId} />
    </MobileLayout>
  );
}
