"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/colecao", label: "Dashboard", exact: true },
  { href: "/colecao/cartas", label: "Cartas" },
  { href: "/colecao/faltantes", label: "Faltantes" },
  { href: "/colecao/duplicatas", label: "Duplicatas" },
  { href: "/colecao/wishlist", label: "Wishlist" },
  { href: "/colecao/alertas", label: "Alertas" },
];

export function CollectionNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border pb-px"
      aria-label="Navegação da coleção"
      data-testid="collection-nav"
    >
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
