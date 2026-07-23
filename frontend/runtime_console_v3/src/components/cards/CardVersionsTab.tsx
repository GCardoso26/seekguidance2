"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCardVersions } from "@/hooks/useCardVersions";
import { gameCardDetailPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { CardVersion } from "@/lib/card-versions-query";
import type { GameId, UnifiedCard } from "@/types/card";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  cardId: string;
  card?: UnifiedCard;
  relatedCards?: UnifiedCard[];
};

function CardVersionItem({
  version,
  gameSlug,
  activeCardId,
}: {
  version: CardVersion;
  gameSlug: string;
  activeCardId: string;
}) {
  const href = version.card_id
    ? gameCardDetailPath(gameSlug, version.card_id)
    : `/marketplace/produtos?q=${encodeURIComponent(version.expansion_code)}`;

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/40">
      <Image
        src={version.image_url}
        alt={version.expansion_name}
        width={64}
        height={88}
        className="h-22 w-16 shrink-0 rounded object-contain"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium">{version.expansion_name}</h3>
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
            {version.expansion_code.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">#{version.collector_number}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {version.rarity} · {new Date(version.expansion_release_date).getFullYear()}
        </p>
        <div className="mt-1 flex gap-2 text-xs">
          {version.foil_available && <span className="text-amber-600">Foil</span>}
          {version.non_foil_available && <span className="text-slate-600">Non-foil</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium">
          {version.available_items} disponível{version.available_items !== 1 ? "is" : ""}
        </p>
        {version.lowest_price && (
          <p className="text-lg font-bold text-primary">
            {formatCurrency(version.lowest_price.cents / 100, version.lowest_price.currency)}
          </p>
        )}
        <Link href={href} className="text-xs text-primary hover:underline">
          Ver ofertas →
        </Link>
      </div>
    </div>
  );
}

function FallbackVersions({ card, relatedCards }: { card: UnifiedCard; relatedCards: UnifiedCard[] }) {
  const gameSlug = GAME_TOKENS[card.game as GameId]?.slug ?? String(card.game).toLowerCase();
  const bySet = new Map<string, UnifiedCard>();
  bySet.set(card.set?.code ?? card.id, card);
  for (const c of relatedCards) {
    const key = c.set?.code ?? c.id;
    if (!bySet.has(key)) bySet.set(key, c);
  }
  const versions = Array.from(bySet.values());

  return (
    <ul className="space-y-2">
      {versions.map((v) => (
        <li key={v.id}>
          <Link
            href={gameCardDetailPath(gameSlug, v.id)}
            className={`block rounded-md border px-4 py-3 text-sm hover:bg-muted/40 ${
              v.id === card.id ? "border-primary/30 bg-primary/5 font-medium" : ""
            }`}
          >
            {v.set?.code && <span className="mr-2 font-mono text-xs">{v.set.code}</span>}
            {v.set?.name}
            {v.listingCount != null && v.listingCount > 0 && (
              <span className="float-right text-muted-foreground">{v.listingCount} ofertas</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CardVersionsTab({ cardId, card, relatedCards = [] }: Props) {
  const [sort, setSort] = useState("release_date_desc");
  const { data, isLoading, isError } = useCardVersions(cardId, { in_stock: true, sort });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if ((isError || !data?.versions.length) && card) {
    return <FallbackVersions card={card} relatedCards={relatedCards} />;
  }

  if (!data?.versions.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma versão indexada no catálogo.</p>;
  }

  const gameSlug =
    (card && GAME_TOKENS[card.game as GameId]?.slug) ||
    String(card?.game ?? "mtg").toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.total_versions} versões · {data.total_items} itens disponíveis
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
          aria-label="Ordenar versões"
        >
          <option value="release_date_desc">Mais recente</option>
          <option value="release_date_asc">Mais antiga</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>
      <div className="space-y-3">
        {data.versions.map((version) => (
          <CardVersionItem
            key={`${version.blueprint_id}-${version.expansion_code}`}
            version={version}
            gameSlug={gameSlug}
            activeCardId={cardId}
          />
        ))}
      </div>
    </div>
  );
}
