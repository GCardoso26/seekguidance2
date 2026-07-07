"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useHeaderNotifications } from "@/hooks/useHeaderNotifications";
import { useOperationalSnapshot } from "@/hooks/useOperationalSnapshot";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  buildOperationalInboxItems,
  filterInboxByCategory,
  INBOX_CATEGORY_LABELS,
  loadInboxReadIds,
  markAllInboxRead,
  markInboxItemRead,
  type InboxCategory,
} from "@/lib/seller-operational-inbox";

const FILTER_TABS: Array<{ id: InboxCategory | "all"; label: string }> = [
  { id: "all", label: "Todas" },
  ...(
    Object.entries(INBOX_CATEGORY_LABELS) as Array<[InboxCategory, string]>
  ).map(([id, label]) => ({ id, label })),
];

export default function SellerInboxPage() {
  const [filter, setFilter] = useState<InboxCategory | "all">("all");
  const [readIds, setReadIds] = useState(() => loadInboxReadIds());
  const header = useHeaderNotifications(isFeatureEnabled("HEADER_NOTIFICATIONS"));
  const { actions } = useOperationalSnapshot();

  const items = useMemo(
    () => buildOperationalInboxItems(header.data?.categories ?? [], actions),
    [header.data, actions],
  );

  const filtered = filterInboxByCategory(items, filter);
  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  return (
    <>
      <SellerHeader subtitle="Inbox operacional" action={null} />
      <PageShell>
        <PageHeader
          title="Inbox"
          description="Pedidos, tickets, chargebacks e alertas em um só lugar."
          action={
            unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => setReadIds(markAllInboxRead(items, readIds))}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
              >
                Marcar todas como lidas
              </button>
            ) : null
          }
        />

        <div className="mb-4 flex flex-wrap gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3 py-1 text-xs ${
                filter === tab.id ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ul className="space-y-2" data-testid="seller-inbox-list">
          {filtered.length === 0 && (
            <li className="rounded-xl border border-white/10 p-6 text-center text-sm text-luxury-mist">
              Nenhuma notificação nesta categoria.
            </li>
          )}
          {filtered.map((item) => {
            const unread = !readIds.has(item.id);
            return (
              <li
                key={item.id}
                className={`rounded-xl border p-4 transition ${
                  item.urgent
                    ? "border-red-500/40 bg-red-500/10"
                    : unread
                      ? "border-luxury-gold/30 bg-white/[0.04]"
                      : "border-white/10 bg-white/[0.02] opacity-80"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-luxury-mist">
                      {INBOX_CATEGORY_LABELS[item.category]}
                    </p>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-luxury-mist">{item.description}</p>
                  </div>
                  {item.count != null && item.count > 1 && (
                    <span className="rounded-full bg-black/20 px-2 py-0.5 text-sm font-bold tabular-nums">
                      {item.count}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={item.href}
                    onClick={() => setReadIds(markInboxItemRead(item.id, readIds))}
                    className="rounded-lg bg-luxury-gold px-3 py-1.5 text-xs font-semibold text-luxury-onyx"
                  >
                    Acessar
                  </Link>
                  {unread && (
                    <button
                      type="button"
                      onClick={() => setReadIds(markInboxItemRead(item.id, readIds))}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </PageShell>
    </>
  );
}
