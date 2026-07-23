"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CardCard } from "@/components/cards/CardCard";
import { DeckShoppingPanel } from "@/components/deckbuilder/DeckShoppingPanel";
import { ExportDeckButton } from "@/components/deckbuilder/ExportDeckButton";
import { DeckAnalysisPanel } from "@/components/deck-v2/DeckAnalysisPanel";
import { DeckCollectionPanel } from "@/components/deck-v2/DeckCollectionPanel";
import { DeckCommentsScaffold } from "@/components/deck-v2/DeckCommentsScaffold";
import { DeckLivePanels } from "@/components/live-data/DeckLivePanels";
import { DeckIntelligencePanel } from "@/components/intelligence/IntelligencePanels";
import { DeckRecommendationPanel } from "@/components/recommendations/RecommendationPanels";
import { ContextualAssistantStrip } from "@/components/ai-assistants/ContextualAssistantStrip";
import { stubDeckAssistant } from "@/lib/ai-assistants/interfaces";
import { DeckSocialActions } from "@/components/social/DeckSocialActions";
import { DeckHistoryPanel } from "@/components/deck-v2/DeckHistoryPanel";
import { DeckSettingsPanel } from "@/components/deck-v2/DeckSettingsPanel";
import { DeckSharePanel } from "@/components/deck-v2/DeckSharePanel";
import { DeckStatsPanel } from "@/components/deck-v2/DeckStatsPanel";
import {
  DeckWorkspaceHero,
} from "@/components/deck-v2/DeckWorkspaceHero";
import {
  DECK_WORKSPACE_TABS,
  DeckWorkspaceTabs,
  type DeckWorkspaceTabId,
} from "@/components/deck-v2/DeckWorkspaceTabs";
import { useCreateDeck, useDeck } from "@/hooks/useDeck";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { gameCardDetailPath } from "@/lib/game-routes";
import { gameMetaFromCode } from "@/lib/collection-v2";
import { Skeleton } from "@/components/ui/skeleton";

function isTab(v: string | null): v is DeckWorkspaceTabId {
  return DECK_WORKSPACE_TABS.some((t) => t.id === v);
}

function DeckWorkspaceInner({ deckId }: { deckId: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const tabParam = search.get("tab");
  const active: DeckWorkspaceTabId = isTab(tabParam) ? tabParam : "resumo";
  const { data: deck, isLoading, error } = useDeck(deckId);
  const create = useCreateDeck();
  const [shareOpen, setShareOpen] = useState(false);

  const setTab = (id: DeckWorkspaceTabId) => {
    const params = new URLSearchParams(search.toString());
    params.set("tab", id);
    router.replace(`/decks/${deckId}?${params.toString()}`, { scroll: false });
  };

  const meta = useMemo(
    () => (deck ? gameMetaFromCode(deck.game) : null),
    [deck],
  );

  if (!isFeatureEnabled("DECK_V2")) {
    return (
      <p className="text-small text-muted-foreground">
        Deck Builder V2 desligado.{" "}
        <Link href={`/decks/${deckId}/edit`} className="text-primary hover:underline">
          Abrir editor clássico
        </Link>
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !deck) {
    return <p className="text-muted-foreground">Deck não encontrado ou privado.</p>;
  }

  const duplicate = () => {
    create.mutate(
      {
        name: `${deck.name} (cópia)`,
        game: deck.game,
        format: deck.format,
        description: deck.description ?? undefined,
        is_public: false,
      },
      {
        onSuccess: (d) => router.push(`/decks/${d.id}/edit`),
      },
    );
  };

  return (
    <div className="space-y-6" data-testid="deck-workspace">
      <Link href="/decks" className="text-small text-muted-foreground hover:text-primary">
        ← Meus decks
      </Link>

      <DeckWorkspaceHero
        deck={deck}
        onShare={() => {
          setShareOpen(true);
          setTab("config");
        }}
        onDuplicate={duplicate}
      />

      {shareOpen && (
        <DeckSharePanel deck={deck} onClose={() => setShareOpen(false)} />
      )}

      <DeckSocialActions deck={deck} />
      <DeckLivePanels deckId={deck.id} gameId={deck.game} deckName={deck.name} />
      <DeckIntelligencePanel deckId={deck.id} />
      <ContextualAssistantStrip
        surface="deck"
        load={() => stubDeckAssistant.substituteForSavings({ deckId: deck.id })}
      />
      <DeckRecommendationPanel deckId={deck.id} />

      <DeckWorkspaceTabs active={active} onChange={setTab} />

      <div className="min-h-[20rem]">
        {active === "resumo" && (
          <div className="space-y-8">
            <DeckStatsPanel deck={deck} />
            {deck.description && (
              <p className="text-body text-muted-foreground">{deck.description}</p>
            )}
          </div>
        )}

        {active === "cartas" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <ExportDeckButton deck={deck} />
              <Link
                href={`/decks/${deck.id}/edit`}
                className="text-small text-primary hover:underline"
              >
                Editar lista
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {deck.main_deck.map((entry) => (
                <Link
                  key={entry.id}
                  href={gameCardDetailPath(meta?.slug || "mtg", entry.card_id)}
                  className="relative"
                >
                  <CardCard card={entry.card} variant="compact" showPrice={false} />
                  <span className="absolute right-2 top-2 rounded bg-foreground/70 px-2 py-0.5 text-xs text-background">
                    {entry.quantity}x
                  </span>
                </Link>
              ))}
            </div>
            {deck.sideboard.length > 0 && (
              <>
                <h3 className="text-h3">Sideboard</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                  {deck.sideboard.map((entry) => (
                    <Link
                      key={entry.id}
                      href={gameCardDetailPath(meta?.slug || "mtg", entry.card_id)}
                      className="relative"
                    >
                      <CardCard card={entry.card} variant="compact" showPrice={false} />
                      <span className="absolute right-2 top-2 rounded bg-foreground/70 px-2 py-0.5 text-xs text-background">
                        {entry.quantity}x
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {active === "analise" && <DeckAnalysisPanel deck={deck} />}
        {active === "colecao" && <DeckCollectionPanel deck={deck} />}
        {active === "marketplace" && (
          <div className="space-y-4">
            <p className="text-small text-muted-foreground">
              Combinação de vendedores e checkout via Marketplace + Checkout APIs existentes —
              sem lógica de pagamento no Deck Builder.
            </p>
            <DeckShoppingPanel deckId={deck.id} deckName={deck.name} />
          </div>
        )}
        {active === "historico" && <DeckHistoryPanel deck={deck} />}
        {active === "comentarios" && <DeckCommentsScaffold deck={deck} />}
        {active === "config" && <DeckSettingsPanel deck={deck} />}
      </div>
    </div>
  );
}

export function DeckWorkspace({ deckId }: { deckId: string }) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <DeckWorkspaceInner deckId={deckId} />
    </Suspense>
  );
}
