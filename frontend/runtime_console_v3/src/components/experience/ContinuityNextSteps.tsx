"use client";

import Link from "next/link";
import { POST_PURCHASE_CONTINUITY_LINKS } from "@/lib/player-journey";
import { continueShoppingHref } from "@/lib/journey-context";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

/**
 * Next steps that keep the player inside one continuous product.
 */
export function ContinuityNextSteps({
  className,
  variant = "purchase",
}: {
  className?: string;
  variant?: "purchase" | "card";
}) {
  if (!isFeatureEnabled("PLAYER_JOURNEY_CONTINUITY")) return null;

  const shopHref = continueShoppingHref("/loja");

  if (variant === "card") {
    return (
      <nav
        className={cn("flex flex-wrap gap-2 text-xs", className)}
        aria-label="Continuar jornada"
        data-testid="continuity-card-steps"
      >
        <Link href="/wishlist" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40">
          Wishlist
        </Link>
        <Link href="/loja" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40">
          Marketplace
        </Link>
        <Link href="/colecao" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40">
          Coleção
        </Link>
        <Link href="/decks" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40">
          Decks
        </Link>
        <Link href="/notifications" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40">
          Alertas
        </Link>
      </nav>
    );
  }

  return (
    <nav
      className={cn("flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center", className)}
      aria-label="Próximos passos da jornada"
      data-testid="continuity-purchase-steps"
    >
      {POST_PURCHASE_CONTINUITY_LINKS.map((link) => {
        const href = link.href === "/loja" ? shopHref : link.href;
        return (
          <Link
            key={link.href}
            href={href}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-muted/40"
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
