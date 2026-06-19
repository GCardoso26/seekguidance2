"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Home, Plus, User, Users } from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof Home };

const NAV: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/social/communities", label: "Social", icon: Users },
  { href: "/tournament/create", label: "Criar", icon: Plus },
  { href: "/player/me", label: "Perfil", icon: User },
];

function MobileNavItem({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs ${
        active ? "text-luxury-gold" : "text-luxury-mist"
      }`}
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
      <main id="main-content" className={hideNav ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
        {children}
      </main>
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/10 bg-luxury-obsidian/95 p-2 backdrop-blur md:hidden">
          {NAV.map((item) => (
            <MobileNavItem key={item.href} {...item} />
          ))}
        </nav>
      )}
    </div>
  );
}
