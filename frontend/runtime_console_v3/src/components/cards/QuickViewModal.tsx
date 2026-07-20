"use client";

import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { CardImage } from "@/components/ui/CardImage";
import { Button } from "@/components/ui/button";
import { useCardDetail } from "@/hooks/useCardDetail";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { GAME_TOKENS, gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { RarityBadge } from "@/components/catalog/RarityBadge";
import { useEffect } from "react";

interface QuickViewModalProps {
  cardId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CONDITION_STYLES: Record<string, string> = {
  NM: "bg-green-100 text-green-700",
  LP: "bg-yellow-100 text-yellow-700",
  MP: "bg-orange-100 text-orange-700",
  HP: "bg-red-100 text-red-700",
  DM: "bg-red-200 text-red-800",
};

export function QuickViewModal({ cardId, isOpen, onClose }: QuickViewModalProps) {
  const { data, isLoading, error } = useCardDetail(cardId ?? "");

  const card = data?.card;
  const listings = data?.listings ?? [];
  const gameToken = card ? GAME_TOKENS[card.game as GameId] : null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar os detalhes da carta.
          </p>
        )}

        {card && !isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative aspect-[63/88] overflow-hidden rounded-lg bg-muted/30">
              <CardImage
                src={cardImageUrl(card)}
                alt={card.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h2 id="quick-view-title" className="text-2xl font-bold">
                  {card.name}
                </h2>
                <p className="text-muted-foreground">
                  {card.set.name} · {gameToken?.name ?? card.game}
                </p>
                {card.rarity && <RarityBadge game={card.game} rarity={card.rarity} className="mt-2" />}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Listagens ({listings.length})</h3>
                {listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma listagem ativa.</p>
                ) : (
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {listings.map((listing) => (
                      <li
                        key={listing.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30"
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              CONDITION_STYLES[listing.condition] ?? "bg-muted",
                            )}
                          >
                            {listing.condition}
                          </span>
                          {listing.foil && <span className="text-caption text-muted-foreground">Foil</span>}
                          <span className="truncate text-sm">{listing.sellerName}</span>
                          {listing.sellerReputation > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Nota {listing.sellerReputation.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-bold">
                            {formatCurrency(listing.price, listing.currency)}
                          </span>
                          <Button size="sm" asChild>
                            <Link href="/carrinho">+ Carrinho</Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button className="w-full" asChild>
                <Link href={`/loja/cartas/${card.id}`} onClick={onClose}>
                  Ver página completa →
                </Link>
              </Button>

              {gameToken && (
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={`/loja/${gameSlugFromId(card.game as GameId)}/busca`}
                    onClick={onClose}
                  >
                    Ver mais de {gameToken.name}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
