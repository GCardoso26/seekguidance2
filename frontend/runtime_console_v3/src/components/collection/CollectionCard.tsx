"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardImage } from "@/components/ui/CardImage";
import { cardImageUrl } from "@/lib/format-currency";
import type { CollectionItem } from "@/hooks/useDeck";
import type { UnifiedCard } from "@/types/card";

interface CollectionCardProps {
  item: CollectionItem;
  onEdit: (item: CollectionItem) => void;
  onRemove: (itemId: string) => void;
  busy?: boolean;
}

function toUnifiedCard(item: CollectionItem): UnifiedCard {
  const uris = (item.card?.image_uris ?? {}) as UnifiedCard["imageUris"];
  return {
    id: item.card_id,
    name: item.card?.name ?? "Carta",
    game: (item.card?.game_code ?? "MTG") as UnifiedCard["game"],
    set: {
      name: item.card?.set_name ?? "",
      code: item.card?.set_code ?? "",
    },
    number: "",
    imageUris: item.card?.image_url ? { normal: item.card.image_url, ...uris } : uris,
    language: "pt",
    rarity: "common",
    gameData: {},
  };
}

export function CollectionCard({ item, onEdit, onRemove, busy }: CollectionCardProps) {
  const card = toUnifiedCard(item);

  return (
    <li className="flex items-center gap-4 surface-card p-4">
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded">
        <CardImage
          src={cardImageUrl(card)}
          alt={item.card?.name ?? "Carta"}
          fallbackLabel={item.card?.name}
          fill
          listQuality
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{item.card?.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.card?.game_code} · {item.card?.set_name ?? item.card?.set_code} · {item.condition}
          {item.is_foil ? " · Foil" : ""}
        </p>
        <p className="text-xs text-primary">Quantidade: {item.quantity}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(item)} disabled={busy}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onRemove(item.id)} disabled={busy}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
