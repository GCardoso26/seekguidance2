"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLLECTION_CONDITIONS } from "@/lib/collection";
import { useAddToCollection } from "@/hooks/useDeck";

interface AddToCollectionModalProps {
  open: boolean;
  cardId?: string;
  cardName?: string;
  onClose: () => void;
}

export function AddToCollectionModal({ open, cardId, cardName, onClose }: AddToCollectionModalProps) {
  const add = useAddToCollection();
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("NM");
  const [isFoil, setIsFoil] = useState(false);

  if (!open || !cardId) return null;

  const handleSave = async () => {
    await add.mutateAsync({ card_id: cardId, quantity, condition, is_foil: isFoil });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold text-foreground">Adicionar à coleção</h2>
        {cardName && <p className="mt-1 text-sm text-muted-foreground">{cardName}</p>}

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            Quantidade
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 border-border bg-card"
            />
          </label>
          <label className="block text-sm">
            Condição
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {COLLECTION_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFoil} onChange={(e) => setIsFoil(e.target.checked)} />
            Foil
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={add.isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
