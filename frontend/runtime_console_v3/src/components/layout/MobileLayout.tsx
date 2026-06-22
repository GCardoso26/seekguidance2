"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState, type FormEvent } from "react";
import {
  Layers,
  Scale,
  Search,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import { GlobalNotificationBell } from "@/components/notifications/GlobalNotificationBell";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { LigaPassWidget } from "@/components/gamification/LigaPassWidget";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof ShoppingBag };

const NAV: NavItem[] = [
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/regras", label: "Regras", icon: Scale },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

const QUICK_LINKS = [
  { href: "/loja/mtg", label: "Magic" },
  { href: "/loja/pokemon", label: "Pokémon" },
  { href: "/loja/yugioh", label: "Yu-Gi-Oh!" },
  { href: "/loja/lorcana", label: "Lorcana" },
  { href: "/loja/onepiece", label: "One Piece" },
  { href: "/loja/fab", label: "FaB" },
  { href: "/loja/digimon", label: "Digimon" },
  { href: "/loja/tendencias", label: "Tendências" },
];

function MobileNavItem({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs",
        active ? "text-luxury-gold" : "text-luxury-mist",
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

function DesktopNavLink({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex",
        active ? "bg-luxury-gold/10 text-luxury-gold" : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function QuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedSearch = useDebounce(query, 300);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/loja/busca?q=${encodeURIComponent(q)}`);
    else router.push("/loja/busca");
  };

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length < 2) return;
    // Prefetch de busca para reduzir latência sem saturar o backend.
    void fetch(`/api/catalog/cards/search?q=${encodeURIComponent(q)}&limit=6`, { cache: "no-store" }).catch(
      () => undefined,
    );
  }, [debouncedSearch]);

  return (
    <form onSubmit={handleSubmit} className="relative hidden lg:block">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-luxury-mist" />
      <input
        type="search"
        placeholder="Buscar cartas…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 w-52 rounded-lg border border-white/10 bg-luxury-obsidian pl-9 pr-3 text-sm text-luxury-frost focus:outline-none focus:ring-2 focus:ring-luxury-gold/30 xl:w-64"
        aria-label="Busca rápida de cartas"
      />
    </form>
  );
}

export function MobileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/judge" || pathname.startsWith("/judge/");
  const showSubNav = pathname.startsWith("/loja") || pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-luxury-onyx text-luxury-frost">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-luxury-gold focus:px-4 focus:py-2 focus:text-luxury-onyx"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-luxury-obsidian/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="shrink-0 text-sm font-semibold text-luxury-gold">
              Judge TCG
            </Link>
            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Principal">
              {NAV.map((item) => (
                <DesktopNavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <QuickSearch />
            <LigaPassWidget compact />
            <CartHeaderButton />
            <GlobalNotificationBell />
          </div>
        </div>
        {showSubNav && (
          <div className="hidden border-t border-white/5 md:block">
            <div className="flex gap-4 overflow-x-auto px-4 py-2 text-xs text-luxury-mist">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-luxury-gold">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      <main id="main-content" className={hideNav ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
        {children}
      </main>
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/10 bg-luxury-obsidian/95 p-2 backdrop-blur md:hidden"
          aria-label="Navegação mobile"
        >
          {NAV.map((item) => (
            <MobileNavItem key={item.href} {...item} />
          ))}
        </nav>
      )}
    </div>
  );
}
