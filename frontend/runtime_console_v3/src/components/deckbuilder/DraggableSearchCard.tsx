"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import type { UnifiedCard } from "@/types/card";
import { cardImageUrl } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

export function DraggableSearchCard({
  card,
  onClick,
}: {
  card: UnifiedCard;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `search-${card.id}`,
    data: { card, type: "search-card" },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const imageSrc = cardImageUrl(card);

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "relative aspect-[63/88] w-full overflow-hidden rounded-lg border border-white/10 bg-white/5",
        isDragging && "opacity-40",
      )}
      aria-label={`Adicionar ${card.name} ao deck`}
    >
      <Image
        src={imageSrc}
        alt={card.name}
        fill
        className="object-cover"
        sizes="120px"
        unoptimized={imageSrc.endsWith(".svg")}
      />
    </button>
  );
}
