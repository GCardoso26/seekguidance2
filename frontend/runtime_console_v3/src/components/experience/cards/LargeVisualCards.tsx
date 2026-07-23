"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ResponsiveImage } from "@/components/assets/ResponsiveImage";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/assets";

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
  mediaType?: MediaType;
};

function LargeArt({
  imageUrl,
  title,
  contain,
  priority,
  mediaType = "MARKETPLACE_CARD",
}: {
  imageUrl?: string | null;
  title: string;
  contain?: boolean;
  priority?: boolean;
  mediaType?: MediaType;
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
    <ResponsiveImage
      src={imageUrl}
      alt={title}
      mediaType={mediaType}
      width={LARGE_W}
      height={LARGE_H}
      priority={priority}
      zoomOnHover
      listQuality={!priority}
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
  mediaType,
}: BaseProps & { contain?: boolean; footer?: ReactNode }) {
  return (
    <Link href={href} className={cn("large-visual-card group block", className)}>
      <LargeArt
        imageUrl={imageUrl}
        title={title}
        contain={contain}
        priority={priority}
        mediaType={mediaType}
      />
      <div className="space-y-1 p-4">
        {meta ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--game-accent)]">
            {meta}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-base font-semibold text-[color:var(--game-text)]">
          {title}
        </h3>
        {subtitle ? (
          <p className="line-clamp-2 text-sm text-[color:var(--game-text-muted)]">{subtitle}</p>
        ) : null}
        {footer}
      </div>
    </Link>
  );
}

export function ExpansionCardHero(props: BaseProps & { code?: string }) {
  return (
    <CardShell
      {...props}
      mediaType="SET_KEY_ART"
      meta={props.code ? `Set · ${props.code}` : props.meta ?? "Expansão"}
      contain
    />
  );
}

export function GameHeroCard(props: BaseProps) {
  return <CardShell {...props} mediaType="CARD_FULL" meta={props.meta ?? "Destaque"} />;
}

export function LargeMarketplaceCard(props: BaseProps & { priceLabel?: string }) {
  return (
    <CardShell
      {...props}
      mediaType="MARKETPLACE_CARD"
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

export function LargeSealedCard(props: BaseProps) {
  return (
    <CardShell {...props} mediaType="SEALED_PRODUCT" meta={props.meta ?? "Selado"} contain />
  );
}

export function DeckShowcaseCard(props: BaseProps & { format?: string }) {
  return (
    <CardShell
      {...props}
      mediaType="DECK_COVER"
      meta={props.format ? `Deck · ${props.format}` : props.meta ?? "Deck"}
    />
  );
}

export function NewsCard(props: BaseProps & { dateLabel?: string }) {
  return (
    <CardShell
      {...props}
      mediaType="NEWS_IMAGE"
      meta={props.dateLabel ?? props.meta ?? "Novidade"}
      contain
    />
  );
}

export function EventCard(props: BaseProps & { when?: string }) {
  return (
    <CardShell
      {...props}
      mediaType="EVENT_IMAGE"
      meta={props.when ?? props.meta ?? "Evento"}
      contain
    />
  );
}
