"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROFILE_NAV } from "@/lib/profile-v2";
import { cn } from "@/lib/utils";

export function ProfileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-hide"
      aria-label="Navegação do perfil"
      data-testid="profile-nav"
    >
      {PROFILE_NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
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
