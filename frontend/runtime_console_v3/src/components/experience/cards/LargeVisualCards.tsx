"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";

const LARGE_W = 420;
const LARGE_H = 560;

type BaseProps = {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  meta?: string;
  className?: string;
  priority?: boolean;
};

function LargeArt({
  imageUrl,
  title,
  contain,
  priority,
}: {
  imageUrl?: string | null;
  title: string;
  contain?: boolean;
  priority?: boolean;
}) {
  if (!imageUrl) {
    return (
      <div
        className="large-visual-card__art flex items-center justify-center text-sm text-[color:var(--game-text-muted)]"
        style={{ aspectRatio: `${LARGE_W}/${LARGE_H}` }}
        aria-hidden
      >
        {title.slice(0, 1)}
      </div>
    );
  }
  return (
    <Image
      src={imageUrl}
      alt=""
      width={LARGE_W}
      height={LARGE_H}
      priority={priority}
      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 420px"
      unoptimized={shouldBypassImageOptimizer(imageUrl)}
      className={cn(
        "large-visual-card__art",
        contain && "large-visual-card__art--contain",
      )}
    />
  );
}

function CardShell({
  href,
  title,
  subtitle,
  meta,
  imageUrl,
  className,
  priority,
  contain,
  footer,
}: BaseProps & { contain?: boolean; footer?: ReactNode }) {
  return (
    <Link href={href} className={cn("large-visual-card group block", className)}>
      <LargeArt imageUrl={imageUrl} title={title} contain={contain} priority={priority} />
      <div className="space-y-1 p-4">
        {meta ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--game-accent)]">
            {meta}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-base font-semibold text-[color:var(--game-text)]">{title}</h3>
        {subtitle ? (
          <p className="line-clamp-2 text-sm text-[color:var(--game-text-muted)]">{subtitle}</p>
        ) : null}
        {footer}
      </div>
    </Link>
  );
}

/** Expansão em destaque (~400×500). */
export function ExpansionCardHero(props: BaseProps & { code?: string }) {
  return (
    <CardShell
      {...props}
      meta={props.code ? `Set · ${props.code}` : props.meta ?? "Expansão"}
      contain
    />
  );
}

/** Card herói do jogo / featured art. */
export function GameHeroCard(props: BaseProps) {
  return <CardShell {...props} meta={props.meta ?? "Destaque"} />;
}

/** Listing marketplace visual grande. */
export function LargeMarketplaceCard(
  props: BaseProps & { priceLabel?: string },
) {
  return (
    <CardShell
      {...props}
      meta={props.meta ?? "Marketplace"}
      footer={
        props.priceLabel ? (
          <p className="pt-2 text-sm font-semibold text-[color:var(--game-accent)]">
            {props.priceLabel}
          </p>
        ) : null
      }
    />
  );
}

/** Produto selado grande. */
export function LargeSealedCard(props: BaseProps) {
  return <CardShell {...props} meta={props.meta ?? "Selado"} contain />;
}

/** Deck em showcase. */
export function DeckShowcaseCard(props: BaseProps & { format?: string }) {
  return (
    <CardShell
      {...props}
      meta={props.format ? `Deck · ${props.format}` : props.meta ?? "Deck"}
    />
  );
}

/** Notícia / editorial (estrutura para Social Layer futuro). */
export function NewsCard(props: BaseProps & { dateLabel?: string }) {
  return (
    <CardShell
      {...props}
      meta={props.dateLabel ?? props.meta ?? "Novidade"}
      contain
    />
  );
}

/** Evento / torneio (estrutura — Ranking/Eventos pós-Beta). */
export function EventCard(props: BaseProps & { when?: string }) {
  return (
    <CardShell
      {...props}
      meta={props.when ?? props.meta ?? "Evento"}
      contain
    />
  );
}
