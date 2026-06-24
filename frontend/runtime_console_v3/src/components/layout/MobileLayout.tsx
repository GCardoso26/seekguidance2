"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Layers, Scale, ShoppingBag, User, Users } from "lucide-react";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof ShoppingBag };

const NAV: NavItem[] = [
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/regras", label: "Regras", icon: Scale },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
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

export function MobileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/judge" || pathname.startsWith("/judge/");

  return (
    <div className="flex min-h-screen flex-col bg-luxury-onyx text-luxury-frost">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-luxury-gold focus:px-4 focus:py-2 focus:text-luxury-onyx"
      >
        Pular para o conteúdo
      </a>
      <GlobalHeader />
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
