"use client";

import { BadgeDollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

interface DeckPriceTagProps {
  totalCents: number;
}

export function DeckPriceTag({ totalCents }: DeckPriceTagProps) {
  return (
    <div className="fixed bottom-24 right-4 z-40 rounded-xl border border-primary/30 bg-card/95 px-4 py-3 shadow-lg md:bottom-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BadgeDollarSign className="h-4 w-4 text-primary" />
        Preço estimado
      </div>
      <p className="mt-1 text-lg font-semibold text-primary">{formatCurrency(totalCents / 100)}</p>
    </div>
  );
}
