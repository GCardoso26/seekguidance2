"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Layers, Scale, ShoppingBag, Users } from "lucide-react";
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

const GlobalSearchBar = dynamic(
  () => import("@/components/home/GlobalSearchBar").then((m) => m.GlobalSearchBar),
  {
    ssr: false,
    loading: () => <div className="h-9 w-full max-w-xl rounded-lg bg-muted/40" aria-hidden />,
  },
);

const GameMegaMenu = dynamic(
  () => import("@/components/games/GameMegaMenu").then((m) => m.GameMegaMenu),
  {
    ssr: false,
    loading: () => (
      <div className="hidden h-9 w-28 animate-pulse rounded-lg bg-muted/40 md:block" aria-hidden />
    ),
  },
);

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
  /** Checkout: logo + entrar/conta apenas — sem search/mega/menu badges (LCP). */
  chrome?: "default" | "checkout";
  children?: ReactNode;
}

export function GlobalHeader({ showGameTabs = true, chrome = "default" }: GlobalHeaderProps) {
  const pathname = usePathname();
  const { user, loading } = useJudgeAuth();
  const isCheckout = chrome === "checkout";
  const isStoreSearch = pathname === "/loja/busca" || pathname?.startsWith("/loja/busca?");
  const showTabs =
    !isCheckout &&
    !isStoreSearch &&
    showGameTabs &&
    (pathname.startsWith("/loja") || pathname === "/" || Boolean(pathname.match(/^\/[a-z-]+\/cards/)));

  if (pathname?.startsWith("/login") || pathname?.startsWith("/entrar") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50">
      {!isCheckout && <CpfRequiredBanner />}
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

            {!isCheckout && (
              <>
                <HeaderGamePicker />
                <nav className="hidden shrink-0 items-center gap-0.5 xl:flex" aria-label="Principal">
                  <DesktopNav />
                </nav>
                {/* Busca antes das ações p/ não esmagar Trocar; min-w-0 evita overflow flex */}
                <div className="min-w-0 flex-1 overflow-hidden px-1 sm:px-2">
                  <GlobalSearchBar
                    variant="header"
                    placeholder="Buscar cartas, lojas, decks…"
                    className="mx-auto w-full max-w-xl"
                  />
                </div>
                <div className="hidden shrink-0 xl:block">
                  <HeaderNavActions />
                </div>
              </>
            )}

            {isCheckout && <div className="min-w-0 flex-1" />}

            <div className="flex shrink-0 items-center gap-1">
              {!isCheckout && (
                <>
                  <ThemeToggle compact className="hidden sm:inline-flex" />
                  <UserLevelBadge compact />
                  <WishlistBadge />
                  <CartHeaderButton />
                </>
              )}
              {loading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-hidden />
              ) : user ? (
                <>
                  {!isCheckout && <GlobalNotificationBell />}
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
