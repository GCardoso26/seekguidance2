"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCardSearch } from "@/hooks/useCardSearch";
import {
  useAddCardToDeck,
  useDeck,
  useDeckFormats,
  useRemoveDeckCard,
  useUserCollection,
  useValidateDeck,
  useUpdateDeckCard,
} from "@/hooks/useDeck";
import type { DeckBuilderZoneId } from "@/types/deck";
import type { UnifiedCard } from "@/types/card";
import { FormatValidator } from "@/lib/deck/validators";
import { cardImageUrl } from "@/lib/format-currency";
import { calculateDeckPrice } from "@/lib/deck-pricing";
import { validateDeckCards, type DeckFormatRules } from "@/lib/deck-validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeckZone } from "./DeckZone";
import { DeckStats } from "./DeckStats";
import { DeckToolbar } from "./DeckToolbar";
import { DraggableSearchCard } from "./DraggableSearchCard";
import { CardSearchModal } from "./CardSearchModal";
import { DeckValidationBar } from "./DeckValidationBar";
import { DeckPriceTag } from "./DeckPriceTag";
import { BuyMissingCardsButton } from "./BuyMissingCardsButton";

interface DeckBuilderProps {
  deckId: string;
}

export function DeckBuilder({ deckId }: DeckBuilderProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCard, setActiveCard] = useState<UnifiedCard | null>(null);
  const [activeZone, setActiveZone] = useState<DeckBuilderZoneId>("main");
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: deck, isLoading } = useDeck(deckId);
  const addCard = useAddCardToDeck(deckId);
  const updateCard = useUpdateDeckCard(deckId);
  const removeCard = useRemoveDeckCard(deckId);
  const validateDeck = useValidateDeck(deckId);
  const { data: userCollection = [] } = useUserCollection();
  const { data: deckFormats = [] } = useDeckFormats(deck?.game);

  const gameCode = deck?.game?.toUpperCase() ?? "MTG";
  const { data, isLoading: searchLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCardSearch({
      q: searchQuery,
      game: gameCode,
      limit: 24,
    });

  const cards = useMemo(
    () => data?.pages.flatMap((p) => p.cards) ?? [],
    [data],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const validator = useMemo(
    () => (deck ? new FormatValidator(deck.format, deck.game) : null),
    [deck],
  );

  const currentFormat = useMemo(
    () => deckFormats.find((f) => f.id === deck?.format_id || f.slug === deck?.format),
    [deckFormats, deck?.format_id, deck?.format],
  );

  const validationPreview = useMemo(() => {
    if (!deck) return null;
    return validateDeckCards(deck, (currentFormat?.rules ?? {}) as DeckFormatRules);
  }, [deck, currentFormat?.rules]);

  const pricing = useMemo(
    () => (deck ? calculateDeckPrice([...deck.main_deck, ...deck.sideboard]) : { total: 0, byGame: {}, currency: "USD" as const }),
    [deck],
  );

  const addToZone = useCallback(
    async (card: UnifiedCard, zone: DeckBuilderZoneId) => {
      if (!deck || !validator) return;
      const check = validator.canAddCard(deck, card, zone);
      if (!check.valid) {
        setError(check.reason ?? "Não foi possível adicionar a carta");
        return;
      }
      setError(null);
      try {
        await addCard.mutateAsync({ card_id: card.id, zone, quantity: 1 });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao adicionar carta");
      }
    },
    [addCard, deck, validator],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCard(event.active.data.current?.card as UnifiedCard);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const card = event.active.data.current?.card as UnifiedCard | undefined;
    const zone = event.over?.id as DeckBuilderZoneId | undefined;
    setActiveCard(null);
    if (!card || !zone) return;
    void addToZone(card, zone);
  };

  if (!isClient || isLoading || !deck) {
    return <div className="p-8 text-luxury-mist">Carregando deckbuilder…</div>;
  }

  const busy = addCard.isPending || updateCard.isPending || removeCard.isPending;
  const showCommander = deck.format.toLowerCase() === "commander";

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-1/3">
          <div className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca rápida..."
              className="border-white/10 bg-white/5"
            />
            <Button type="button" variant="outline" onClick={() => setShowSearchModal(true)}>
              Buscar
            </Button>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {searchLoading && cards.length === 0 && (
              <p className="col-span-full text-sm text-luxury-mist">Buscando cartas…</p>
            )}
            {cards.map((card) => (
              <DraggableSearchCard
                key={card.id}
                card={card}
                onClick={() => void addToZone(card, activeZone)}
              />
            ))}
          </div>
          {hasNextPage && (
            <button
              type="button"
              className="text-sm text-luxury-gold"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
            </button>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-2/3">
          <DeckToolbar deck={deck} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <DeckValidationBar
            currentCards={validator?.zoneTotal(deck, "main") ?? 0}
            minCards={Number((currentFormat?.rules?.min_cards as number | undefined) ?? 60)}
            maxCards={(currentFormat?.rules?.max_cards as number | null | undefined) ?? null}
            validation={validationPreview ?? undefined}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => validateDeck.mutate()}
              disabled={validateDeck.isPending}
            >
              {validateDeck.isPending ? "Validando..." : "Validar deck"}
            </Button>
            <BuyMissingCardsButton
              deck={deck}
              ownedCardIds={userCollection.map((entry) => entry.card_id)}
            />
          </div>

          <Tabs value={activeZone} onValueChange={(v) => setActiveZone(v as DeckBuilderZoneId)}>
            <TabsList>
              <TabsTrigger value="main">
                Main ({validator?.zoneTotal(deck, "main") ?? 0})
              </TabsTrigger>
              <TabsTrigger value="sideboard">
                Sideboard ({validator?.zoneTotal(deck, "sideboard") ?? 0})
              </TabsTrigger>
              {showCommander && (
                <TabsTrigger value="commander">
                  Commander ({validator?.zoneTotal(deck, "commander") ?? 0})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="main" className="mt-3">
              <DeckZone
                id="main"
                label="Main deck"
                cards={deck.main_deck}
                maxCards={validator?.zoneLimit("main") ?? 60}
                busy={busy}
                onRemove={(id) => removeCard.mutate(id)}
                onQuantityChange={(id, qty) => updateCard.mutate({ deckCardId: id, quantity: qty })}
              />
            </TabsContent>

            <TabsContent value="sideboard" className="mt-3">
              <DeckZone
                id="sideboard"
                label="Sideboard"
                cards={deck.sideboard}
                maxCards={validator?.zoneLimit("sideboard") ?? 15}
                busy={busy}
                onRemove={(id) => removeCard.mutate(id)}
                onQuantityChange={(id, qty) => updateCard.mutate({ deckCardId: id, quantity: qty })}
              />
            </TabsContent>

            {showCommander && (
              <TabsContent value="commander" className="mt-3">
                <DeckZone
                  id="commander"
                  label="Commander"
                  cards={deck.commander}
                  maxCards={1}
                  busy={busy}
                  onRemove={(id) => removeCard.mutate(id)}
                  onQuantityChange={(id, qty) => updateCard.mutate({ deckCardId: id, quantity: qty })}
                />
              </TabsContent>
            )}
          </Tabs>

          <DeckStats deck={deck} />
        </div>
      </div>

      <CardSearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        gameCode={gameCode}
        defaultZone={activeZone}
        onCardSelect={(card, zone) => void addToZone(card, zone)}
      />

      <DeckPriceTag totalCents={pricing.total} />

      <DragOverlay>
        {activeCard && (
          <div className="relative h-36 w-24 rotate-3 opacity-90 shadow-xl">
            <Image
              src={cardImageUrl(activeCard)}
              alt={activeCard.name}
              fill
              className="rounded-lg object-cover"
              sizes="96px"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
