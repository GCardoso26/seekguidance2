"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Layers, Scale, ShoppingBag, Users } from "lucide-react";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { GameTabs } from "@/components/navigation/GameTabs";
import { GlobalNotificationBell } from "@/components/notifications/GlobalNotificationBell";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { LigaPassWidget } from "@/components/gamification/LigaPassWidget";
import { UserMenu } from "@/features/auth/UserMenu";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { mapHealthToGames } from "@/lib/catalog-games";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof ShoppingBag };

const NAV: NavItem[] = [
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/regras", label: "Regras", icon: Scale },
  { href: "/comunidade", label: "Comunidade", icon: Users },
];

function DesktopNavLink({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      data-testid={`nav-${href.replace(/\//g, "") || "home"}`}
      className={cn(
        "hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex",
        active
          ? "bg-luxury-gold/10 text-luxury-gold"
          : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

interface GlobalHeaderProps {
  showGameTabs?: boolean;
  children?: ReactNode;
}

export function GlobalHeader({ showGameTabs = true }: GlobalHeaderProps) {
  const pathname = usePathname();
  const { user, loading } = useJudgeAuth();
  const { data: health } = useCatalogHealth();
  const games = mapHealthToGames(health);
  const showTabs = showGameTabs && (pathname.startsWith("/loja") || pathname === "/");

  if (pathname?.startsWith("/login") || pathname?.startsWith("/entrar") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-luxury-obsidian/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold text-luxury-gold"
            data-testid="header-logo"
          >
            <span className="text-lg">⚖️</span>
            <span className="hidden sm:inline">Judge TCG</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {NAV.map((item) => (
              <DesktopNavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            <GlobalSearchBar
              variant="header"
              placeholder="Buscar cards, sellers, decks…"
              className="max-w-none"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <LigaPassWidget compact />
            <CartHeaderButton />
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" aria-hidden />
            ) : user ? (
              <>
                <GlobalNotificationBell />
                <UserMenu />
              </>
            ) : (
              <Link
                href="/entrar"
                data-testid="login-submit"
                className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-medium text-luxury-onyx transition hover:bg-luxury-gold/90"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        {showTabs && <GameTabs games={games} className="border-t border-white/5" />}
      </div>
    </header>
  );
}
