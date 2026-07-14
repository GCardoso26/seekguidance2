"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Layers, Scale, ShoppingBag, Users } from "lucide-react";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { GameMegaMenu } from "@/components/games/GameMegaMenu";
import { HeaderNavActions } from "@/components/layout/HeaderNavActions";
import { HeaderGamePicker } from "@/components/layout/HeaderGamePicker";
import { GlobalNotificationBell } from "@/components/notifications/GlobalNotificationBell";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { WishlistBadge } from "@/components/marketplace/WishlistBadge";
import { CpfRequiredBanner } from "@/components/kyc/CpfRequiredBanner";
import { UserLevelBadge } from "@/components/gamification/UserLevelBadge";
import { UserMenu } from "@/features/auth/UserMenu";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useRulesAccess } from "@/hooks/useRulesAccess";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
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
        "hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors md:flex",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function DesktopNav() {
  const { allowed: rulesAllowed, loading: rulesLoading } = useRulesAccess();
  const items = rulesLoading ? NAV.filter((n) => n.href !== "/regras") : NAV.filter((n) => n.href !== "/regras" || rulesAllowed);

  return (
    <>
      {items.map((item) => (
        <DesktopNavLink key={item.href} {...item} />
      ))}
    </>
  );
}

interface GlobalHeaderProps {
  showGameTabs?: boolean;
  children?: ReactNode;
}

export function GlobalHeader({ showGameTabs = true }: GlobalHeaderProps) {
  const pathname = usePathname();
  const { user, loading } = useJudgeAuth();
  const showTabs =
    showGameTabs &&
    (pathname.startsWith("/loja") || pathname === "/" || Boolean(pathname.match(/^\/[a-z-]+\/cards/)));

  if (pathname?.startsWith("/login") || pathname?.startsWith("/entrar") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50">
      <CpfRequiredBanner />
      <header className="border-b border-border bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-12 items-center gap-3 lg:h-14">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground"
              data-testid="header-logo"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-base">⚖️</span>
              <span className="hidden sm:inline">Judge TCG</span>
            </Link>

            <HeaderGamePicker />

            <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Principal">
              <DesktopNav />
            </nav>

            <HeaderNavActions />

            <div className="min-w-0 flex-1">
              <GlobalSearchBar
                variant="header"
                placeholder="Buscar cards, sellers, decks…"
                className="max-w-none"
              />
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle compact className="hidden sm:inline-flex" />
              <UserLevelBadge compact />
              <WishlistBadge />
              <CartHeaderButton />
              {loading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-hidden />
              ) : user ? (
                <>
                  <GlobalNotificationBell />
                  <UserMenu />
                </>
              ) : (
                <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/entrar" data-testid="login-submit">
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {showTabs && <GameMegaMenu />}
      </header>
    </div>
  );
}
