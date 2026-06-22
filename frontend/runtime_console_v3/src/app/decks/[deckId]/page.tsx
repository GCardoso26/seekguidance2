"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Copy, Heart } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardCard } from "@/components/cards/CardCard";
import { Button } from "@/components/ui/button";
import { DeckToolbar } from "@/components/deckbuilder/DeckToolbar";
import { BuyDeckButton } from "@/components/deckbuilder/BuyDeckButton";
import { useDeck, exportDeck } from "@/hooks/useDeck";

export default function DeckShowcasePage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck, isLoading, error } = useDeck(deckId);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-8 text-luxury-mist">Carregando deck…</div>
      </MobileLayout>
    );
  }

  if (error || !deck) {
    return (
      <MobileLayout>
        <div className="p-8 text-luxury-mist">Deck não encontrado ou privado.</div>
      </MobileLayout>
    );
  }

  const handleCopy = async () => {
    const result = await exportDeck(deck.id, "text");
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/decks" className="text-sm text-luxury-mist">
          ← Decks
        </Link>

        <div className="mt-4">
          <DeckToolbar deck={deck} showBuy />
        </div>

        {deck.description && <p className="mt-4 text-luxury-mist">{deck.description}</p>}

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-luxury-mist">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-4 w-4" /> {deck.likes}
          </span>
          <span>{deck.views} visualizações</span>
          {deck.owner?.display_name && <span>por {deck.owner.display_name}</span>}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {deck.main_deck.map((entry) => (
            <Link key={entry.id} href={`/cards/${entry.card_id}`} className="relative">
              <CardCard card={entry.card} variant="compact" showPrice={false} />
              <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                {entry.quantity}x
              </span>
            </Link>
          ))}
        </div>

        {deck.sideboard.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-semibold text-luxury-frost">Sideboard</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {deck.sideboard.map((entry) => (
                <Link key={entry.id} href={`/cards/${entry.card_id}`} className="relative">
                  <CardCard card={entry.card} variant="compact" showPrice={false} />
                  <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {entry.quantity}x
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copiado!" : "Copiar lista"}
          </Button>
          <BuyDeckButton deck={deck} />
          <Link href={`/decks/${deck.id}/edit`}>
            <Button type="button">Editar deck</Button>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}
