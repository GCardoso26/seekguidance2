"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import {
  SIDEBAR_ITEMS,
  filterAvailableSidebarItems,
  isSidebarItemLocked,
  sidebarItemActive,
  type SidebarItem,
} from "@/lib/seller-sidebar-nav";
import { cn } from "@/lib/utils";

type Props = {
  sellerId?: string | null;
  storeSlug?: string | null;
  plan?: string;
  className?: string;
  onNavigate?: () => void;
};

function badgeCount(
  item: SidebarItem,
  metrics?: { pending_payment?: number },
  tickets?: number,
): number | undefined {
  if (item.badgeKey === "pending_payment" && metrics?.pending_payment) {
    return metrics.pending_payment;
  }
  if (item.badgeKey === "open_tickets" && tickets) return tickets;
  return undefined;
}

function NavItem({
  item,
  plan,
  pathname,
  onNavigate,
  metrics,
  openTickets,
  depth = 0,
}: {
  item: SidebarItem;
  plan: string;
  pathname: string;
  onNavigate?: () => void;
  metrics?: { pending_payment?: number };
  openTickets?: number;
  depth?: number;
}) {
  const locked = isSidebarItemLocked(plan, item);
  const active = sidebarItemActive(pathname, item.href);
  const [expanded, setExpanded] = useState(active);
  const hasChildren = Boolean(item.children?.length);
  const Icon = item.icon;
  const badge = badgeCount(item, metrics, openTickets);

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={locked ? "/vendedor/painel/planos" : item.href}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 transition-colors",
            depth > 0 && "pl-8 text-xs",
            active ? "bg-luxury-gold/20 text-luxury-gold" : "text-luxury-mist hover:bg-white/5",
            locked && "opacity-60",
          )}
          title={locked ? "Disponível em plano superior" : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{item.label}</span>
          {badge != null && badge > 0 && (
            <span className="ml-auto rounded-full bg-amber-500/30 px-1.5 text-[10px] font-semibold text-amber-100">
              {badge}
            </span>
          )}
          {locked && <span className="ml-auto text-xs">🔒</span>}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={expanded ? "Recolher" : "Expandir"}
            onClick={() => setExpanded((v) => !v)}
            className="rounded px-2 py-1 text-xs text-luxury-mist hover:bg-white/5"
          >
            {expanded ? "▾" : "▸"}
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              plan={plan}
              pathname={pathname}
              onNavigate={onNavigate}
              metrics={metrics}
              openTickets={openTickets}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ sellerId, storeSlug, plan = "free", className, onNavigate }: Props) {
  const pathname = usePathname() ?? "";
  const { data: overview } = useDashboardOverview();

  const publicStoreHref = storeSlug
    ? `/marketplace/loja/${storeSlug}`
    : sellerId
      ? `/vendedor/${sellerId}`
      : null;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-luxury-onyx/95 text-sm",
        className,
      )}
    >
      <div className="border-b border-white/10 p-4">
        <p className="text-xs uppercase tracking-wide text-luxury-mist">Judge TCG</p>
        <p className="font-semibold text-luxury-gold">Painel do Vendedor</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {filterAvailableSidebarItems(SIDEBAR_ITEMS).map((item) => (
          <NavItem
            key={item.id}
            item={item}
            plan={plan}
            pathname={pathname}
            onNavigate={onNavigate}
            metrics={overview?.metrics}
            openTickets={overview?.open_tickets}
          />
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        {publicStoreHref && (
          <Link
            href={publicStoreHref}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2 text-luxury-mist hover:bg-white/5"
          >
            Ver loja pública
          </Link>
        )}
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
