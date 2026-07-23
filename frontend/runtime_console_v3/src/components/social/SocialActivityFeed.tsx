"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  defaultActivityFeedProvider,
  type ActivityItem,
} from "@/lib/profile-activity";
import { fetchPublicDecks, fetchPublicEvents } from "@/lib/live-data/fetchers";
import { cn } from "@/lib/utils";

async function buildUnifiedFeed(): Promise<ActivityItem[]> {
  const [decks, events, alerts] = await Promise.all([
    fetchPublicDecks(8),
    fetchPublicEvents(4),
    (async () => {
      try {
        const res = await fetch("/api/wishlist/alerts");
        if (!res.ok) return [];
        const data = (await res.json()) as { alerts?: Array<{ id: string; title?: string; triggeredAt?: string }> };
        return data.alerts ?? [];
      } catch {
        return [];
      }
    })(),
  ]);

  const base = defaultActivityFeedProvider.buildFromProjections({
    recentDecks: decks.map((d) => ({
      id: d.id,
      name: d.name || d.title || "Deck",
      updatedAt: d.updatedAt,
      isPublic: true,
    })),
    wishlistAlerts: alerts,
  });

  for (const e of events) {
    base.push({
      id: `event-${e.id}`,
      kind: "generic",
      title: `Evento: ${e.name || e.title || "Torneio"}`,
      href: `/tournament/${e.id}`,
      occurredAt: e.starts_at || new Date().toISOString(),
    });
  }

  base.push({
    id: "expansion-pulse",
    kind: "generic",
    title: "Novas expansões nos portais",
    href: "/lorcana/expansions",
    occurredAt: new Date().toISOString(),
  });

  return base
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 20);
}

/**
 * Feed unificado — decks, wishlist, eventos, expansões (projeção FE sobre APIs públicas).
 */
export function SocialActivityFeed({ className }: { className?: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["social-unified-feed"],
    queryFn: buildUnifiedFeed,
    staleTime: 45_000,
  });

  return (
    <section className={cn("space-y-4", className)} data-testid="social-activity-feed">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">Feed</h2>
        <Link href="/social" className="text-xs text-primary hover:underline">
          Comunidade →
        </Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Atualizando atividade…</p>}
      <ul className="space-y-2">
        {data.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href || "/social"}
              className="block rounded-xl border border-border bg-card/40 px-4 py-3 transition hover:border-primary/40"
            >
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              ) : null}
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {new Date(item.occurredAt).toLocaleString("pt-BR")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
