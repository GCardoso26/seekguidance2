"use client";

import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck, DeckFormat } from "@/types/deck";
import { usePublishDeck } from "@/hooks/useDeck";
import { BuyDeckButton } from "./BuyDeckButton";
import { SaveDeckButton } from "./SaveDeckButton";
import { ExportDeckButton } from "./ExportDeckButton";

interface DeckToolbarProps {
  deck: Deck;
  format?: DeckFormat | null;
  onImport?: () => void;
  onSaved?: () => void;
  showBuy?: boolean;
}

export function DeckToolbar({ deck, format, onImport, onSaved, showBuy = false }: DeckToolbarProps) {
  const router = useRouter();
  const publish = usePublishDeck(deck.id);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-foreground">{deck.name}</h1>
        <p className="text-sm capitalize text-muted-foreground">
          {deck.game} · {deck.format}
          {deck.is_public && (
            <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-success">
              Público
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {onImport && (
          <Button type="button" variant="outline" size="sm" onClick={onImport}>
            Importar
          </Button>
        )}

        <ExportDeckButton deck={deck} />
        <SaveDeckButton deck={deck} format={format} onSaved={onSaved} />

        {!deck.is_public && (
          <Button
            type="button"
            size="sm"
            onClick={() => publish.mutate()}
            disabled={publish.isPending || deck.is_validated === false}
            title={deck.is_validated === false ? "Valide o deck antes de publicar" : undefined}
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
          Workspace
        </Button>

        {showBuy && <BuyDeckButton deck={deck} />}
      </div>
    </div>
  );
}
