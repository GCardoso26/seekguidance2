"use client";

import Link from "next/link";
import type { CardSummary } from "@/src/types/api";
import { setLabel } from "@/src/lib/format";

/**
 * Catalog-only search hit — no marketplace fields (price/store) in this block.
 */
export function SearchResultItem({ card }: { card: CardSummary }) {
  return (
    <article className="border-b border-zinc-200 py-4 last:border-b-0">
      <h2 className="text-base font-semibold text-zinc-900">{card.name}</h2>
      <dl className="mt-1 space-y-0.5 text-sm text-zinc-600">
        <div>
          <dt className="inline font-medium text-zinc-800">Set: </dt>
          <dd className="inline">{setLabel(card.setCode, card.setName)}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-zinc-800">Rarity: </dt>
          <dd className="inline">{card.rarity ?? "—"}</dd>
        </div>
      </dl>
      <Link
        href={`/cards/${encodeURIComponent(card.id)}`}
        className="mt-3 inline-block text-sm font-medium text-emerald-800 underline"
      >
        Ver ofertas
      </Link>
    </article>
  );
}

export function SearchResultList({ cards }: { cards: CardSummary[] }) {
  return (
    <div className="divide-y-0">
      {cards.map((card) => (
        <SearchResultItem key={card.id} card={card} />
      ))}
    </div>
  );
}
