"use client";

import { use } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { DeckWorkspace } from "@/components/deck-v2/DeckWorkspace";

export default function DeckShowcasePage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);

  return (
    <MobileLayout>
      <div className="page-container py-6 lg:py-8">
        <DeckWorkspace deckId={deckId} />
      </div>
    </MobileLayout>
  );
}
