"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HeaderNavActions } from "@/components/layout/HeaderNavActions";
import { HeaderGamePicker } from "@/components/layout/HeaderGamePicker";
import { SandboxModeBadge } from "@/components/sandbox/SandboxModeBadge";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isSandboxMode } from "@/lib/app-mode";
import { entrarPath } from "@/lib/auth/entrar-path";
import { brand } from "@/lib/brand";

const GlobalSearchBar = dynamic(
  () => import("@/components/home/GlobalSearchBar").then((m) => m.GlobalSearchBar),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto h-10 w-full max-w-2xl rounded-md bg-muted/50" aria-hidden />
    ),
  },
);

const GameMegaMenu = dynamic(
  () => import("@/components/games/GameMegaMenu").then((m) => m.GameMegaMenu),
  {
    ssr: false,
    loading: () => (
      <div className="hidden h-9 w-28 rounded-md bg-muted/50 md:block" aria-hidden />
    ),
  },
);

const GlobalNotificationBell = dynamic(
  () =>
    import("@/components/notifications/GlobalNotificationBell").then(
      (m) => m.GlobalNotificationBell,
    ),
  { ssr: false, loading: () => <div className="h-9 w-9 rounded-md bg-muted/50" aria-hidden /> },
);

const WishlistBadge = dynamic(
  () => import("@/components/marketplace/WishlistBadge").then((m) => m.WishlistBadge),
  { ssr: false, loading: () => <div className="h-9 w-9 rounded-md bg-muted/50" aria-hidden /> },
);

const UserMenu = dynamic(
  () => import("@/features/auth/UserMenu").then((m) => m.UserMenu),
  { ssr: false, loading: () => <div className="h-9 w-9 rounded-md bg-muted/50" aria-hidden /> },
);

const CpfRequiredBanner = dynamic(
  () => import("@/components/kyc/CpfRequiredBanner").then((m) => m.CpfRequiredBanner),
  { ssr: false },
);

/** BP 5.1 / Customer Conversion First — Compra em destaque; Eventos fora do nav primário. */
const STORE_NAV = [
  { href: "/loja", label: "Comprar" },
  { href: "/loja/singles", label: "Singles" },
  { href: "/loja/selados", label: "Selados" },
  { href: "/loja/acessorios", label: "Acessórios" },
] as const;

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      data-testid={`nav-${href.replace(/\//g, "") || "home"}`}
      className={cn(
        "hidden items-center rounded-md px-3 py-2 text-sm font-medium md:flex",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
      )}
    >
      {label}
    </Link>
  );
}

interface GlobalHeaderProps {
  showGameTabs?: boolean;
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
      <header className="border-b border-border bg-card" role="banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center gap-3">
            <Link
              href="/loja"
              className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              data-testid="header-logo"
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logoMarkPath}
                  alt=""
                  className="h-6 w-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <span
                  className="hidden h-full w-full items-center justify-center bg-primary text-xs font-bold tracking-tight text-primary-foreground"
                  aria-hidden
                >
                  JT
                </span>
              </span>
              <span className="font-display hidden text-base font-semibold tracking-tight text-foreground sm:inline">
                {brand.name}
              </span>
            </Link>

            {!isCheckout && (
              <>
                <HeaderGamePicker />
                <nav className="hidden shrink-0 items-center gap-1 xl:flex" aria-label="Navegação principal">
                  {STORE_NAV.map((item) => (
                    <DesktopNavLink key={item.href} {...item} />
                  ))}
                </nav>
                <div className="min-w-0 flex-1 overflow-hidden px-1 sm:px-3">
                  <GlobalSearchBar
                    variant="header"
                    placeholder="Buscar carta ou loja…"
                    className="mx-auto w-full max-w-2xl"
                  />
                </div>
              </>
            )}

            {isCheckout && <div className="min-w-0 flex-1" />}

            <div className="flex shrink-0 items-center gap-1" aria-label="Ações da conta">
              {!isCheckout && (
                <>
                  {isSandboxMode() && <SandboxModeBadge />}
                  <div className="hidden lg:block">
                    <HeaderNavActions />
                  </div>
                  <WishlistBadge />
                  <CartHeaderButton />
                </>
              )}
              {loading ? (
                <div className="h-9 w-9 rounded-md bg-muted/50" aria-hidden />
              ) : user ? (
                <>
                  {!isCheckout && <GlobalNotificationBell />}
                  <UserMenu />
                </>
              ) : (
                <Button asChild size="sm" className="min-h-10 bg-primary text-primary-foreground">
                  <Link
                    href={entrarPath(pathname && pathname !== "/entrar" ? pathname : "/loja")}
                    data-testid="login-submit"
                  >
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
