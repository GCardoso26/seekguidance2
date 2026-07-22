"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Copy,
  Download,
  ExternalLink,
  Pencil,
  ShoppingCart,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { gameMetaFromCode } from "@/lib/collection-v2";
import type { Deck } from "@/types/deck";
import { cn } from "@/lib/utils";

type Props = {
  deck: Deck;
  onShare?: () => void;
  onDuplicate?: () => void;
  className?: string;
};

export function DeckWorkspaceHero({ deck, onShare, onDuplicate, className }: Props) {
  const commander = deck.commander?.[0]?.card;
  const cover = commander || deck.main_deck?.[0]?.card;
  const imageSrc = cover ? cardImageUrl(cover) : null;
  const meta = gameMetaFromCode(deck.game);
  const owner = deck.owner?.display_name || deck.owner?.username || "Você";

  return (
    <header
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card/50",
        className,
      )}
      data-testid="deck-workspace-hero"
      style={{ borderTopWidth: 3, borderTopColor: meta.primary }}
    >
      <div className="grid gap-6 p-4 sm:grid-cols-[140px_1fr] sm:p-6">
        <div className="relative mx-auto aspect-[5/7] w-28 overflow-hidden rounded-xl bg-muted sm:mx-0 sm:w-full">
          {imageSrc ? (
            <Image src={imageSrc} alt="" fill className="object-cover" sizes="140px" />
          ) : (
            <div className="flex h-full items-center justify-center text-caption text-muted-foreground">
              Sem arte
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-caption text-muted-foreground">
              {meta.name} · {deck.format}
              {commander ? ` · ${commander.name}` : ""}
            </p>
            <h1 className="text-display text-foreground sm:text-3xl">{deck.name}</h1>
            <p className="mt-1 text-small text-muted-foreground">
              {owner}
              {" · "}
              {deck.is_public ? "Público" : "Privado"}
              {" · "}
              {deck.total_cards} cartas
              {deck.updated_at
                ? ` · atualizado ${new Date(deck.updated_at).toLocaleDateString("pt-BR")}`
                : ""}
              {deck.total_price
                ? ` · ~${formatCurrency(deck.total_price / 100)}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={`/decks/${deck.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onShare}>
              <Share2 className="mr-1.5 h-4 w-4" />
              Compartilhar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onDuplicate}>
              <Copy className="mr-1.5 h-4 w-4" />
              Duplicar
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/decks/${deck.id}?tab=marketplace`}>
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Comprar faltantes
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/decks/${deck.id}?tab=cartas`}>
                <Download className="mr-1.5 h-4 w-4" />
                Exportar
              </Link>
            </Button>
            {deck.is_public && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/decks/explore`}>
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Explorar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
