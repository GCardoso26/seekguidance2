"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  gameCardsPath,
  gameExpansionsPath,
  gameLandingPath,
} from "@/lib/game-routes";
import { useGamePortal } from "@/components/experience/GameProvider";
import { cn } from "@/lib/utils";

export function PortalNav() {
  const { slug, theme } = useGamePortal();
  const pathname = usePathname() || "";

  const items = [
    { href: gameLandingPath(slug), label: "Portal", match: (p: string) => p === `/${slug}` },
    {
      href: gameCardsPath(slug),
      label: "Singles",
      match: (p: string) => p.startsWith(`/${slug}/cards`),
    },
    {
      href: gameExpansionsPath(slug),
      label: "Expansões",
      match: (p: string) =>
        p.startsWith(`/${slug}/expansions`) || p.startsWith(`/${slug}/sets`),
    },
    {
      href: `/decks?game=${encodeURIComponent(theme.gameId)}`,
      label: "Decks",
      match: (p: string) => p.startsWith("/decks"),
    },
    {
      href: `/loja/busca?game=${encodeURIComponent(theme.gameId)}`,
      label: "Marketplace",
      match: (p: string) => p.startsWith("/loja") || p.startsWith("/marketplace"),
    },
  ];

  return (
    <nav
      className="portal-nav sticky top-0 z-30 backdrop-blur-sm"
      aria-label={`Navegação ${theme.name}`}
    >
      <div className="container mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-0">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              data-active={active ? "true" : "false"}
              className={cn(
                "shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                active && "text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
