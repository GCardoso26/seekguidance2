"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Home, Layers, ShoppingBag, Sparkles, User } from "lucide-react";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home };

const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/comprador", label: "Comprar", icon: Sparkles },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/perfil", label: "Perfil", icon: User },
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
      data-testid={`mobile-nav-${href === "/" ? "home" : href.slice(1)}`}
      className={cn(
        "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-caption font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function MobileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/judge" || pathname.startsWith("/judge/");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <GlobalHeader />
      <main
        id="main-content"
        className={cn(
          "relative z-0 flex-1 animate-fade-in",
          hideNav
            ? ""
            : "pb-[max(var(--mobile-nav-offset),env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        {children}
      </main>
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-2 pt-1.5 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 md:hidden"
          style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
          aria-label="Navegação mobile"
          data-testid="bottom-nav"
        >
          <div className="flex justify-around">
            {MOBILE_NAV.map((item) => (
              <MobileNavItem key={item.href} {...item} />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
