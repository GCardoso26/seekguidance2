"use client";

import { CardImage } from "@/components/ui/CardImage";
import { cardImageUrl } from "@/lib/format-currency";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { CatalogCard } from "@/hooks/useCatalogCards";

type Props = {
  card: CatalogCard;
  onAdd: () => void;
};

export function CardGridItem({ card, onAdd }: Props) {
  const img = cardImageUrl(card);
  return (
    <article className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="relative mb-2 aspect-[5/7] overflow-hidden rounded-lg bg-black/30">
        <CardImage
          src={img}
          alt={card.name}
          fill
          className="object-cover"
          fallbackLabel={card.name}
          unoptimized
        />
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold">{card.name}</h3>
      {card.set_name && <p className="text-xs text-luxury-mist">Set: {card.set_name}</p>}
      {card.lowest_price_cents != null && card.lowest_price_cents > 0 && (
        <p className="mt-1 text-xs text-luxury-gold">
          Preço médio: {formatShopPrice(card.lowest_price_cents)}
        </p>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 rounded-lg bg-luxury-gold px-3 py-2 text-xs font-semibold text-luxury-onyx"
      >
        + Anúncio
      </button>
    </article>
  );
}
