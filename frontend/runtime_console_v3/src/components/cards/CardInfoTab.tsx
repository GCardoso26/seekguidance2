"use client";

import Link from "next/link";
import { formatRarityDisplay } from "@/lib/game-config/rarity";
import type { UnifiedCard } from "@/types/card";

type Props = {
  card: UnifiedCard;
};

export function CardInfoTab({ card }: Props) {
  const scryfallId = card.externalIds?.scryfall;
  const tcgPlayerId = card.externalIds?.tcgplayer;

  return (
    <div className="space-y-6 text-sm">
      {card.oracleText && (
        <section>
          <h3 className="mb-2 font-semibold">Texto Oracle</h3>
          <p className="whitespace-pre-wrap text-muted-foreground">{card.oracleText}</p>
        </section>
      )}

      {card.flavorText && (
        <section>
          <h3 className="mb-2 font-semibold">Flavor</h3>
          <p className="italic text-muted-foreground">{card.flavorText}</p>
        </section>
      )}

      <dl className="grid gap-2 sm:grid-cols-2">
        {card.artist && (
          <>
            <dt className="text-muted-foreground">Artista</dt>
            <dd>{card.artist}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Número</dt>
        <dd>{card.number}</dd>
        <dt className="text-muted-foreground">Raridade</dt>
        <dd>{formatRarityDisplay(card.game, card.rarity)}</dd>
        <dt className="text-muted-foreground">Idioma</dt>
        <dd>{card.language?.toUpperCase()}</dd>
      </dl>

      {card.legalities && Object.keys(card.legalities).length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold">Legalidade</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(card.legalities).map(([format, status]) => (
              <span
                key={format}
                className="rounded-full border px-2 py-0.5 text-xs capitalize"
              >
                {format}: {status === "not_legal" ? "não legal" : status}
              </span>
            ))}
          </div>
        </section>
      )}

      {(scryfallId || tcgPlayerId) && (
        <section>
          <h3 className="mb-2 font-semibold">Links externos</h3>
          <ul className="space-y-1">
            {scryfallId && (
              <li>
                <Link
                  href={`https://scryfall.com/card/${scryfallId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Scryfall ↗
                </Link>
              </li>
            )}
            {tcgPlayerId && (
              <li>
                <Link
                  href={`https://www.tcgplayer.com/product/${tcgPlayerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  TCGplayer ↗
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
