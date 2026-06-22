"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLLECTION_CONDITIONS } from "@/lib/collection";
import type { CollectionItem } from "@/hooks/useDeck";
import { useUpdateCollectionItem } from "@/hooks/useDeck";

interface EditCollectionItemModalProps {
  item: CollectionItem | null;
  onClose: () => void;
}

export function EditCollectionItemModal({ item, onClose }: EditCollectionItemModalProps) {
  const update = useUpdateCollectionItem();
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("NM");
  const [isFoil, setIsFoil] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setCondition(item.condition);
      setIsFoil(item.is_foil);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    await update.mutateAsync({ itemId: item.id, quantity, condition, is_foil: isFoil });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-luxury-onyx p-6">
        <h2 className="text-lg font-semibold text-luxury-frost">Editar item</h2>
        <p className="mt-1 text-sm text-luxury-mist">{item.card?.name}</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            Quantidade
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 border-white/10 bg-luxury-obsidian"
            />
          </label>
          <label className="block text-sm">
            Condição
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-luxury-obsidian px-3 py-2 text-sm"
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
          <Button type="button" onClick={() => void handleSave()} disabled={update.isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
