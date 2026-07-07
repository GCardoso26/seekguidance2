"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_SIDEBAR_ITEMS, adminSidebarItemActive } from "@/lib/admin-sidebar-nav";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function AdminSidebar({ className, onNavigate }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-luxury-onyx/95 text-sm",
        className,
      )}
    >
      <div className="border-b border-white/10 p-4">
        <p className="text-xs uppercase tracking-wide text-luxury-mist">Judge TCG</p>
        <p className="font-semibold text-luxury-gold">Administração</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {ADMIN_SIDEBAR_ITEMS.map((item) => {
          const active = adminSidebarItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                active ? "bg-luxury-gold/20 text-luxury-gold" : "text-luxury-mist hover:bg-white/5",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/observability"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-luxury-mist hover:bg-white/5"
        >
          Observability
        </Link>
        <Link
          href="/loja"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-luxury-mist hover:bg-white/5"
        >
          Voltar ao site
        </Link>
      </div>
    </aside>
  );
}
