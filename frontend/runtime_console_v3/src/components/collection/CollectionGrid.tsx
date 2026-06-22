"use client";

import type { CollectionItem } from "@/hooks/useDeck";
import { CollectionCard } from "./CollectionCard";

interface CollectionGridProps {
  items: CollectionItem[];
  onEdit: (item: CollectionItem) => void;
  onRemove: (itemId: string) => void;
  busy?: boolean;
}

export function CollectionGrid({ items, onEdit, onRemove, busy }: CollectionGridProps) {
  if (items.length === 0) {
    return <p className="text-sm text-luxury-mist">Nenhuma carta na coleção.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <CollectionCard key={item.id} item={item} onEdit={onEdit} onRemove={onRemove} busy={busy} />
      ))}
    </ul>
  );
}
