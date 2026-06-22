"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Globe, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/deck";
import { exportDeck, usePublishDeck } from "@/hooks/useDeck";
import { BuyDeckButton } from "./BuyDeckButton";

interface DeckToolbarProps {
  deck: Deck;
  onSaved?: () => void;
  showBuy?: boolean;
}

export function DeckToolbar({ deck, onSaved, showBuy = false }: DeckToolbarProps) {
  const router = useRouter();
  const publish = usePublishDeck(deck.id);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportDeck(deck.id, "text");
      await navigator.clipboard.writeText(result.content);
      onSaved?.();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-luxury-frost">{deck.name}</h1>
        <p className="text-sm capitalize text-luxury-mist">
          {deck.game} · {deck.format}
          {deck.is_public && (
            <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
              Público
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
          Copiar lista
        </Button>

        {!deck.is_public && (
          <Button
            type="button"
            size="sm"
            onClick={() => publish.mutate()}
            disabled={publish.isPending}
          >
            {publish.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Publicar
          </Button>
        )}

        <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/decks/${deck.id}`)}>
          <Save className="mr-2 h-4 w-4" />
          Ver deck
        </Button>

        {showBuy && (
          <BuyDeckButton deck={deck} />
        )}
      </div>
    </div>
  );
}
