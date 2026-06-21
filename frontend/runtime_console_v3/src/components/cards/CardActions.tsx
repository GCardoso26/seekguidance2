"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, Heart, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import type { UnifiedCard } from "@/types/card";

interface CardActionsProps {
  card: UnifiedCard;
}

export function CardActions({ card }: CardActionsProps) {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog.Root open={alertOpen} onOpenChange={setAlertOpen}>
        <Dialog.Trigger asChild>
          <Button variant="outline" size="sm" type="button">
            <Bell className="mr-1 h-4 w-4" />
            Alerta
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">Criar alerta de preço</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 hover:bg-muted" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <PriceAlertForm card={card} onDone={() => setAlertOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Button variant="outline" size="sm" type="button" aria-label="Adicionar à coleção">
        <Heart className="mr-1 h-4 w-4" />
        Coleção
      </Button>

      <Button variant="outline" size="sm" type="button" aria-label="Adicionar ao deck">
        <Layers className="mr-1 h-4 w-4" />
        Deck
      </Button>
    </div>
  );
}

function PriceAlertForm({ card, onDone }: { card: UnifiedCard; onDone: () => void }) {
  const [targetPrice, setTargetPrice] = useState(
    card.lowestPrice ? Number((card.lowestPrice * 0.9).toFixed(2)) : 0,
  );
  const [condition, setCondition] = useState("any");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/alerts/price — { cardId, targetPrice, condition }
    setSaved(true);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saved && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">
          Alerta registrado localmente (integração em breve).
        </p>
      )}
      <div>
        <label htmlFor="target-price" className="text-sm font-medium">
          Preço-alvo
        </label>
        <input
          id="target-price"
          type="number"
          step="0.01"
          min={0}
          value={targetPrice}
          onChange={(e) => setTargetPrice(Number(e.target.value))}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Preço atual: {formatCurrency(card.lowestPrice || 0, card.latestPrice?.currency)}
        </p>
      </div>

      <div>
        <label htmlFor="alert-condition" className="text-sm font-medium">
          Condição
        </label>
        <select
          id="alert-condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="any">Qualquer</option>
          <option value="NM">Near Mint</option>
          <option value="LP">Lightly Played</option>
          <option value="MP">Moderately Played</option>
        </select>
      </div>

      <Button type="submit" className="w-full">
        Criar alerta
      </Button>
    </form>
  );
}
