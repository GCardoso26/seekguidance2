"use client";

import type { Deck } from "@/types/deck";
import { formatCurrency } from "@/lib/format-currency";
import { FormatValidator } from "@/lib/deck/validators";

interface DeckStatsProps {
  deck: Deck;
}

export function DeckStats({ deck }: DeckStatsProps) {
  const validator = new FormatValidator(deck.format, deck.game);
  const mainTotal = validator.zoneTotal(deck, "main");
  const sideTotal = validator.zoneTotal(deck, "sideboard");
  const mainLimit = validator.zoneLimit("main");
  const sideLimit = validator.zoneLimit("sideboard");

  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm md:grid-cols-4">
      <div>
        <p className="text-luxury-mist">Main</p>
        <p className="font-semibold text-luxury-frost">
          {mainTotal} / {mainLimit}
        </p>
      </div>
      <div>
        <p className="text-luxury-mist">Sideboard</p>
        <p className="font-semibold text-luxury-frost">
          {sideTotal} / {sideLimit}
        </p>
      </div>
      <div>
        <p className="text-luxury-mist">Cartas únicas</p>
        <p className="font-semibold text-luxury-frost">{deck.main_deck.length + deck.sideboard.length}</p>
      </div>
      <div>
        <p className="text-luxury-mist">Valor estimado</p>
        <p className="font-semibold text-luxury-gold">{formatCurrency(deck.total_price / 100)}</p>
      </div>
    </div>
  );
}
