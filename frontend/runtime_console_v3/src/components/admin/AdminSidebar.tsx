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
        "flex h-full flex-col border-r border-border bg-background/95 text-sm",
        className,
      )}
    >
      <div className="border-b border-border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Judge TCG</p>
        <p className="font-semibold text-primary">Administração</p>
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
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/80",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/observability"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted/80"
        >
          Observability
        </Link>
        <Link
          href="/loja"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted/80"
        >
          Voltar ao site
        </Link>
      </div>
    </aside>
  );
}
