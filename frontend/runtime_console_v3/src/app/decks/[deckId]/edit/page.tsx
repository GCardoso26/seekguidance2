"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { DeckBuilder } from "@/components/deckbuilder/DeckBuilder";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

export default function DeckEditPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const router = useRouter();
  const { user, loading } = useJudgeAuth();

  if (!loading && !user) {
    router.push(`/login?next=/decks/${deckId}/edit`);
    return null;
  }

  return (
    <MobileLayout>
      <DeckBuilder deckId={deckId} />
    </MobileLayout>
  );
}
