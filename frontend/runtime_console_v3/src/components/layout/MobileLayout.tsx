"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, Home, Layers, Library, ShoppingBag, User } from "lucide-react";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home };

const MOBILE_NAV_DEFAULT: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/comprador", label: "Conta", icon: User },
  { href: "/decks", label: "Baralhos", icon: Layers },
];

/** Epic 16 — thumb-first: Collection + Notifications in bottom nav. */
const MOBILE_NAV_V2: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/colecao", label: "Coleção", icon: Library },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/notifications", label: "Alertas", icon: Bell },
];

function MobileNavItem({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      data-testid={`mobile-nav-${href === "/" ? "home" : href.slice(1).replace(/\//g, "-")}`}
      className={cn(
        "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-1 text-small font-medium transition-colors touch-manipulation",
        active ? "text-primary" : "text-muted-foreground",
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} aria-hidden />
      <span className="max-w-[4.5rem] truncate text-[10px] leading-tight">{label}</span>
    </Link>
  );
}

export function MobileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/judge" || pathname.startsWith("/judge/");
  const isCheckout =
    pathname === "/checkout" ||
    pathname?.startsWith("/checkout/") ||
    pathname === "/marketplace/checkout" ||
    pathname?.startsWith("/marketplace/checkout/");
  const nav = isFeatureEnabled("MOBILE_FIRST_V2") ? MOBILE_NAV_V2 : MOBILE_NAV_DEFAULT;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <GlobalHeader chrome={isCheckout ? "checkout" : "default"} />
      <main
        id="main-content"
        className={cn(
          "relative z-0 flex-1",
          hideNav || isCheckout
            ? ""
            : "pb-[max(var(--mobile-nav-offset),env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        {children}
      </main>
      {!hideNav && !isCheckout && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-1 pt-1.5 md:hidden"
          style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
          aria-label="Navegação mobile"
          data-testid="bottom-nav"
        >
          <div className="flex justify-around">
            {nav.map((item) => (
              <MobileNavItem key={item.href} {...item} />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
