"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = { href: string; label: string; icon: string };

const NAV: NavItem[] = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/search", label: "Buscar", icon: "🔍" },
  { href: "/tournament/create", label: "Criar", icon: "🏆" },
  { href: "/player/me", label: "Perfil", icon: "👤" },
];

function MobileNavItem({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs ${
        active ? "text-amber-400" : "text-slate-400"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-slate-700 bg-slate-900/95 p-2 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <MobileNavItem key={item.href} {...item} />
        ))}
      </nav>
    </div>
  );
}
