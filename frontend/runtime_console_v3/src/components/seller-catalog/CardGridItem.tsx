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
  const myQty = card.my_quantity ?? 0;
  const myPrice = card.my_price_cents;
  const market = card.lowest_price_cents;
  const listed = Boolean(card.my_listed) || myQty > 0;

  return (
    <article className="flex flex-col surface-card p-3">
      <div className="relative mb-2 aspect-[5/7] overflow-hidden rounded-lg bg-foreground/30">
        <CardImage
          src={img}
          alt={card.name}
          fill
          className="object-cover"
          fallbackLabel={card.name}
          unoptimized
        />
        {listed ? (
          <span className="absolute left-2 top-2 rounded-md bg-emerald-600/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            No estoque · {myQty}
          </span>
        ) : null}
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold">{card.name}</h3>
      {card.set_name && <p className="text-xs text-muted-foreground">Set: {card.set_name}</p>}

      {listed && myPrice != null && myPrice > 0 ? (
        <p className="mt-1 text-sm font-semibold text-foreground">
          Seu preço: {formatShopPrice(myPrice)}
        </p>
      ) : null}
      {market != null && market > 0 ? (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Mercado: {formatShopPrice(market)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onAdd}
        data-testid="btn-add-product"
        className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
      >
        {listed ? "Atualizar anúncio" : "+ Anúncio"}
      </button>
    </article>
  );
}
